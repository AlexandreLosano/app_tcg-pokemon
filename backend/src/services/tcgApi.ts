const TCG_API_BASE = 'https://api.pokemontcg.io/v2';
const RETRY_DELAYS_MS = [500, 1500, 3000];

export function isTcgApiConfigured(): boolean {
  return !!process.env.POKEMON_TCG_API_KEY;
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'X-Api-Key': process.env.POKEMON_TCG_API_KEY ?? '' },
      });
      if (res.status >= 500) throw new Error(`TCG API respondeu ${res.status}`);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise(r => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
    }
  }
  throw lastErr;
}

export interface TcgCardSearchResult {
  id: string;
  name: string;
  supertype?: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  number?: string;
  rarity?: string | null;
  artist?: string;
  nationalPokedexNumbers?: number[];
  set?: { id: string; name: string; series: string; releaseDate: string };
  images: { small: string; large?: string };
}

export async function searchCards(params: {
  name?: string;
  number?: string;
  rarity?: string;
}): Promise<TcgCardSearchResult[]> {
  const parts: string[] = [];
  if (params.name?.trim()) parts.push(`name:"${params.name.trim()}*"`);
  if (params.number?.trim()) parts.push(`number:${params.number.trim()}`);
  if (params.rarity?.trim()) parts.push(`rarity:"${params.rarity.trim()}"`);
  const query = encodeURIComponent(parts.join(' '));
  const url = `${TCG_API_BASE}/cards?q=${query}&pageSize=50&orderBy=-set.releaseDate`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`TCG API respondeu ${res.status}`);
  const json = (await res.json()) as { data?: TcgCardSearchResult[] };
  return json.data ?? [];
}

export async function listRarities(): Promise<string[]> {
  const res = await fetchWithRetry(`${TCG_API_BASE}/rarities`);
  if (!res.ok) throw new Error(`TCG API respondeu ${res.status}`);
  const json = (await res.json()) as { data?: string[] };
  return json.data ?? [];
}
