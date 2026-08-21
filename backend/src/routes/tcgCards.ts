import { Router, Request, Response } from 'express';
import { isTcgApiConfigured, searchCards } from '../services/tcgApi';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  res.json({ configured: isTcgApiConfigured() });
});

router.get('/search', async (req: Request, res: Response) => {
  if (!isTcgApiConfigured()) {
    return res.status(503).json({ error: 'tcg_api_not_configured' });
  }
  const name = String(req.query.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'parâmetro name é obrigatório' });
  try {
    const results = await searchCards(name);
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

export default router;
