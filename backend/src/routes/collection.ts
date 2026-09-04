import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

function normalize(owned: boolean, isDefinitive: boolean, needsTrade: boolean) {
  if (!owned) return { owned: false, is_definitive: false, needs_trade: false };
  if (needsTrade) return { owned: true, is_definitive: false, needs_trade: true };
  if (isDefinitive) return { owned: true, is_definitive: true, needs_trade: false };
  return { owned: true, is_definitive: false, needs_trade: false };
}

router.put('/:formId', async (req: Request, res: Response) => {
  const formId = Number(req.params.formId);
  try {
    const current = await pool.query(
      'SELECT owned, is_definitive, needs_trade, notes, binder_id, binder_page, binder_slot FROM collection_entries WHERE form_id = $1',
      [formId]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'not found' });

    const existing = current.rows[0];
    const owned = req.body.owned ?? existing.owned;
    const isDefinitive = req.body.is_definitive ?? existing.is_definitive;
    const needsTrade = req.body.needs_trade ?? existing.needs_trade;
    const notes = req.body.notes !== undefined ? req.body.notes : existing.notes;
    const binderId = req.body.binder_id !== undefined ? req.body.binder_id : existing.binder_id;
    const binderChanged = req.body.binder_id !== undefined && req.body.binder_id !== existing.binder_id;

    let binderPage = req.body.binder_page !== undefined ? req.body.binder_page : existing.binder_page;
    let binderSlot = req.body.binder_slot !== undefined ? req.body.binder_slot : existing.binder_slot;
    // Página/slot só fazem sentido presos ao fichário em que foram definidos -- trocar (ou
    // remover) o fichário sem informar uma posição nova esvazia a antiga, em vez de carregar
    // um número que passa a apontar para o binder errado.
    if (binderId === null || (binderChanged && req.body.binder_page === undefined && req.body.binder_slot === undefined)) {
      binderPage = null;
      binderSlot = null;
    }

    const normalized = normalize(!!owned, !!isDefinitive, !!needsTrade);

    const { rows } = await pool.query(
      `UPDATE collection_entries
       SET owned = $1, is_definitive = $2, needs_trade = $3, notes = $4, binder_id = $5,
           binder_page = $6, binder_slot = $7, updated_at = now()
       WHERE form_id = $8
       RETURNING form_id, owned, is_definitive, needs_trade, notes, tcg_card_id, binder_id, binder_page, binder_slot, updated_at`,
      [normalized.owned, normalized.is_definitive, normalized.needs_trade, notes, binderId, binderPage, binderSlot, formId]
    );
    res.json(rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') {
      return res.status(409).json({ error: 'Essa página/posição já está ocupada por outra carta nesse fichário.' });
    }
    res.status(500).json({ error: String(err) });
  }
});

router.post('/:formId/attach-card', async (req: Request, res: Response) => {
  const formId = Number(req.params.formId);
  const card = req.body;
  if (!card?.id || !card?.name || !card?.images?.small) {
    return res.status(400).json({ error: 'card.id, card.name e card.images.small são obrigatórios' });
  }
  try {
    await pool.query(
      `INSERT INTO tcg_cards (
         id, name, supertype, subtypes, hp, types, set_id, set_name, set_series, set_release_date,
         card_number, rarity, artist, image_small_url, image_large_url, national_pokedex_numbers, raw_json, cached_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17, now())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         supertype = EXCLUDED.supertype,
         subtypes = EXCLUDED.subtypes,
         hp = EXCLUDED.hp,
         types = EXCLUDED.types,
         set_id = EXCLUDED.set_id,
         set_name = EXCLUDED.set_name,
         set_series = EXCLUDED.set_series,
         set_release_date = EXCLUDED.set_release_date,
         card_number = EXCLUDED.card_number,
         rarity = EXCLUDED.rarity,
         artist = EXCLUDED.artist,
         image_small_url = EXCLUDED.image_small_url,
         image_large_url = EXCLUDED.image_large_url,
         national_pokedex_numbers = EXCLUDED.national_pokedex_numbers,
         raw_json = EXCLUDED.raw_json,
         cached_at = now()`,
      [
        card.id,
        card.name,
        card.supertype ?? null,
        card.subtypes ?? null,
        card.hp ?? null,
        card.types ?? null,
        card.set?.id ?? null,
        card.set?.name ?? null,
        card.set?.series ?? null,
        card.set?.releaseDate ?? null,
        card.number ?? null,
        card.rarity ?? null,
        card.artist ?? null,
        card.images.small,
        card.images.large ?? null,
        card.nationalPokedexNumbers ?? null,
        JSON.stringify(card),
      ]
    );

    const { rows } = await pool.query(
      `UPDATE collection_entries SET tcg_card_id = $1, updated_at = now()
       WHERE form_id = $2
       RETURNING form_id, owned, is_definitive, needs_trade, notes, tcg_card_id, binder_id, binder_page, binder_slot, updated_at`,
      [card.id, formId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/:formId/detach-card', async (req: Request, res: Response) => {
  const formId = Number(req.params.formId);
  try {
    const { rows } = await pool.query(
      `UPDATE collection_entries SET tcg_card_id = NULL, updated_at = now()
       WHERE form_id = $1
       RETURNING form_id, owned, is_definitive, needs_trade, notes, tcg_card_id, binder_id, binder_page, binder_slot, updated_at`,
      [formId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
