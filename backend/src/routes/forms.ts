import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

const VALID_STATUSES = ['visible', 'hidden', 'no_need', 'card_unavailable'];

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'forma';
}

const SELECT_FORM_SQL = `
  SELECT
    f.id,
    f.pokeapi_form_id,
    f.form_slug,
    f.display_name,
    f.display_name_overridden,
    f.form_name,
    f.sprite_url,
    f.is_battle_only,
    f.is_mega,
    f.is_gmax,
    f.is_default_variety,
    f.status,
    f.status_overridden,
    f.generation_id,
    gen.display_name AS generation_display_name,
    f.region_id,
    reg.display_name AS region_display_name,
    sp.id AS species_id,
    sp.name AS species_name,
    sp.display_name AS species_display_name,
    sp.sprite_default_url AS species_sprite_default_url,
    ce.owned,
    ce.is_definitive,
    ce.needs_trade,
    ce.notes,
    ce.tcg_card_id,
    tc.name AS tcg_card_name,
    tc.set_name AS tcg_card_set_name,
    tc.card_number AS tcg_card_number,
    tc.rarity AS tcg_card_rarity,
    tc.image_small_url AS tcg_card_image_small_url,
    tc.image_large_url AS tcg_card_image_large_url,
    ce.binder_id,
    b.name AS binder_name,
    ce.binder_page,
    ce.binder_slot
  FROM forms f
  JOIN species sp ON sp.id = f.species_id
  LEFT JOIN generations gen ON gen.id = f.generation_id
  LEFT JOIN regions reg ON reg.id = f.region_id
  LEFT JOIN collection_entries ce ON ce.form_id = f.id
  LEFT JOIN tcg_cards tc ON tc.id = ce.tcg_card_id
  LEFT JOIN binders b ON b.id = ce.binder_id
`;

const VALID_COLLECTION_STATUSES = ['missing', 'owned', 'definitive', 'trade'];

router.get('/', async (req: Request, res: Response) => {
  const { generation_id, region_id, binder_id, status, collection_status } = req.query;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (generation_id) {
    params.push(Number(generation_id));
    conditions.push(`f.generation_id = $${params.length}`);
  }
  if (region_id) {
    params.push(Number(region_id));
    conditions.push(`f.region_id = $${params.length}`);
  }
  if (binder_id === 'none') {
    conditions.push(`ce.binder_id IS NULL`);
  } else if (binder_id) {
    params.push(Number(binder_id));
    conditions.push(`ce.binder_id = $${params.length}`);
  }
  if (status === 'all') {
    // sem filtro de status
  } else if (typeof status === 'string' && VALID_STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`f.status = $${params.length}`);
  } else {
    conditions.push(`f.status = 'visible'`);
  }

  // Status de posse (statusClass no frontend): mutuamente exclusivos, na mesma ordem de
  // prioridade usada em utils/formDisplay.ts (definitiva/troca prevalecem sobre "tenho" simples).
  if (typeof collection_status === 'string' && VALID_COLLECTION_STATUSES.includes(collection_status)) {
    if (collection_status === 'missing') {
      conditions.push(`NOT ce.owned`);
    } else if (collection_status === 'definitive') {
      conditions.push(`ce.owned AND ce.is_definitive`);
    } else if (collection_status === 'trade') {
      conditions.push(`ce.owned AND ce.needs_trade`);
    } else {
      conditions.push(`ce.owned AND NOT ce.is_definitive AND NOT ce.needs_trade`);
    }
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  try {
    const { rows } = await pool.query(
      `${SELECT_FORM_SQL} ${where} ORDER BY sp.id, f.id`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`${SELECT_FORM_SQL} WHERE f.id = $1`, [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/display-name', async (req: Request, res: Response) => {
  const displayName = typeof req.body.display_name === 'string' ? req.body.display_name.trim() : '';
  if (!displayName) return res.status(400).json({ error: 'display_name é obrigatório' });
  try {
    const { rows } = await pool.query(
      `UPDATE forms SET display_name = $1, display_name_overridden = true, updated_at = now()
       WHERE id = $2
       RETURNING id, display_name, display_name_overridden`,
      [displayName, Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Forma cadastrada manualmente (não vem da PokéAPI) -- ex: diferença visual grande entre
// macho e fêmea que o usuário considera relevante o suficiente para virar um slot próprio,
// mas que o sync não separa (a PokéAPI não modela isso como pokemon-form). Herda espécie,
// geração e região da forma base, então a ordenação (sp.id, f.id) já posiciona certo, logo
// ao lado dela -- sem precisar de nenhum sync/detecção automática.
router.post('/custom', async (req: Request, res: Response) => {
  const displayName = typeof req.body.display_name === 'string' ? req.body.display_name.trim() : '';
  const basedOnFormId = Number(req.body.based_on_form_id);
  if (!displayName) return res.status(400).json({ error: 'display_name é obrigatório' });
  if (!basedOnFormId) return res.status(400).json({ error: 'based_on_form_id é obrigatório' });

  try {
    const base = await pool.query(
      'SELECT species_id, generation_id, region_id, sprite_url FROM forms WHERE id = $1',
      [basedOnFormId]
    );
    if (base.rows.length === 0) return res.status(404).json({ error: 'forma base não encontrada' });
    const { species_id, generation_id, region_id, sprite_url } = base.rows[0];

    const existingSlugs = await pool.query('SELECT form_slug FROM forms WHERE species_id = $1', [species_id]);
    const takenSlugs = new Set(existingSlugs.rows.map((r: { form_slug: string }) => r.form_slug));
    const baseSlug = slugify(displayName);
    let slug = baseSlug;
    let n = 2;
    while (takenSlugs.has(slug)) {
      slug = `${baseSlug}-${n}`;
      n++;
    }

    const seq = await pool.query("SELECT -(1000000 + nextval('custom_form_seq')) AS id");
    const customId = seq.rows[0].id;

    const inserted = await pool.query(
      `INSERT INTO forms (
         pokeapi_form_id, pokeapi_pokemon_id, species_id, form_slug, display_name, form_name,
         is_default_variety, is_battle_only, is_mega, is_gmax, generation_id, region_id,
         sprite_url, status, status_overridden
       ) VALUES ($1, $1, $2, $3, $4, '', false, false, false, false, $5, $6, $7, 'visible', true)
       RETURNING id`,
      [customId, species_id, slug, displayName, generation_id, region_id, sprite_url]
    );
    const formId = inserted.rows[0].id;

    await pool.query('INSERT INTO collection_entries (form_id) VALUES ($1)', [formId]);

    const { rows } = await pool.query(`${SELECT_FORM_SQL} WHERE f.id = $1`, [formId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/:id/custom', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('DELETE FROM forms WHERE id = $1 AND pokeapi_form_id < 0 RETURNING id', [
      Number(req.params.id),
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'forma manual não encontrada (ou não é uma forma manual)' });
    }
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status deve ser um de: ${VALID_STATUSES.join(', ')}` });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE forms SET status = $1, status_overridden = true, updated_at = now()
       WHERE id = $2
       RETURNING id, status, status_overridden`,
      [status, Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
