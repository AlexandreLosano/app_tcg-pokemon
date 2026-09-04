import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT id, name, sort_order FROM binders ORDER BY sort_order, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'name é obrigatório' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO binders (name) VALUES ($1) RETURNING id, name, sort_order',
      [name]
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'já existe um fichário com esse nome' });
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id', async (req: Request, res: Response) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  if (!name) return res.status(400).json({ error: 'name é obrigatório' });
  try {
    const { rows } = await pool.query(
      'UPDATE binders SET name = $1 WHERE id = $2 RETURNING id, name, sort_order',
      [name, Number(req.params.id)]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]);
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'já existe um fichário com esse nome' });
    res.status(500).json({ error: String(err) });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('DELETE FROM binders WHERE id = $1 RETURNING id', [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ error: 'not found' });
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
