import { Router, Request, Response } from 'express';
import { syncPokemonData } from '../services/pokeSync';

const router = Router();

router.post('/pokemon', async (_req: Request, res: Response) => {
  try {
    const summary = await syncPokemonData();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
