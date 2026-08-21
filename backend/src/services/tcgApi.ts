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

export async function searchCards(name: string): Promise<TcgCardSearchResult[]> {
  const query = encodeURIComponent(`name:"${name}*"`);
  const url = `${TCG_API_BASE}/cards?q=${query}&pageSize=25&orderBy=-set.releaseDate`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`TCG API respondeu ${res.status}`);
  const json = await res.json();
  return (json.data ?? []) as TcgCardSearchResult[];
}
