import { Router, Request, Response } from 'express';
import { isTcgApiConfigured, listRarities, searchCards } from '../services/tcgApi';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json({ configured: isTcgApiConfigured() });
});

router.get('/rarities', async (_req: Request, res: Response) => {
  if (!isTcgApiConfigured()) {
    return res.status(503).json({ error: 'tcg_api_not_configured' });
  }
  try {
    const rarities = await listRarities();
    res.json(rarities);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  if (!isTcgApiConfigured()) {
    return res.status(503).json({ error: 'tcg_api_not_configured' });
  }
  const name = String(req.query.name ?? '').trim();
  const number = String(req.query.number ?? '').trim();
  const rarity = String(req.query.rarity ?? '').trim();
  if (!name && !number && !rarity) {
    return res.status(400).json({ error: 'informe ao menos name, number ou rarity' });
  }
  try {
    const results = await searchCards({ name, number, rarity });
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

export default router;
