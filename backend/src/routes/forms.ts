import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

const SELECT_FORM_SQL = `
  SELECT
    f.id,
    f.form_slug,
    f.display_name,
    f.form_name,
    f.sprite_url,
    f.is_battle_only,
    f.is_mega,
    f.is_gmax,
    f.is_default_variety,
    f.living_dex_eligible,
    f.living_dex_eligible_overridden,
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
    tc.image_large_url AS tcg_card_image_large_url
  FROM forms f
  JOIN species sp ON sp.id = f.species_id
  LEFT JOIN generations gen ON gen.id = f.generation_id
  LEFT JOIN regions reg ON reg.id = f.region_id
  LEFT JOIN collection_entries ce ON ce.form_id = f.id
  LEFT JOIN tcg_cards tc ON tc.id = ce.tcg_card_id
`;

router.get('/', async (req: Request, res: Response) => {
  const { generation_id, region_id, eligible_only } = req.query;
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
  if (eligible_only !== 'false') {
    conditions.push('f.living_dex_eligible = true');
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

router.patch('/:id/eligibility', async (req: Request, res: Response) => {
  const { living_dex_eligible } = req.body;
  if (typeof living_dex_eligible !== 'boolean') {
    return res.status(400).json({ error: 'living_dex_eligible (boolean) é obrigatório' });
  }
  try {
    const { rows } = await pool.query(
      `UPDATE forms SET living_dex_eligible = $1, living_dex_eligible_overridden = true, updated_at = now()
       WHERE id = $2
       RETURNING id, living_dex_eligible, living_dex_eligible_overridden`,
      [living_dex_eligible, Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
