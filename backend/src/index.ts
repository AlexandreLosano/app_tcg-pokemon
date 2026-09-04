import express from 'express';
import cors from 'cors';
import { runMigrations } from './db';
import generationsRouter from './routes/generations';
import regionsRouter from './routes/regions';
import speciesRouter from './routes/species';
import formsRouter from './routes/forms';
import collectionRouter from './routes/collection';
import tcgCardsRouter from './routes/tcgCards';
import syncRouter from './routes/sync';
import bindersRouter from './routes/binders';

const app = express();
const PORT = parseInt(process.env.PORT ?? '23000', 10);

app.use(cors());
app.use(express.json());

app.use('/api/generations', generationsRouter);
app.use('/api/regions', regionsRouter);
app.use('/api/species', speciesRouter);
app.use('/api/forms', formsRouter);
app.use('/api/collection', collectionRouter);
app.use('/api/tcg-cards', tcgCardsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/binders', bindersRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

async function start() {
  await runMigrations();
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

start().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
