import { pool } from '../db';

const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';
const ENGLISH_LANGUAGE_ID = 9;

interface SyncSummary {
  generations: number;
  regions: number;
  species_upserted: number;
  forms_upserted: number;
  forms_skipped: number;
  skipped: { pokeapi_form_id: number | null; form_slug: string | null; reason: string }[];
  duration_ms: number;
}

async function graphqlRequest<T>(query: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
      const json = await res.json();
      if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
      return json.data as T;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function parseMaybeJson(value: unknown): any {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

function extractSpriteUrl(rawSprites: unknown, preferOfficialArtwork: boolean): string | null {
  const sprites = parseMaybeJson(rawSprites);
  if (!sprites) return null;
  if (preferOfficialArtwork) {
    const artwork = sprites?.other?.['official-artwork']?.front_default;
    if (artwork) return artwork as string;
  }
  return (sprites?.front_default as string) ?? null;
}

function generationDisplayName(slug: string): string {
  // "generation-i" -> "Generation I"
  const parts = slug.split('-');
  const roman = parts[parts.length - 1] ?? '';
  return `Generation ${roman.toUpperCase()}`;
}

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map(part => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

interface ReferenceData {
  pokemon_v2_generation: { id: number; name: string }[];
  pokemon_v2_region: { id: number; name: string }[];
}

const REFERENCE_QUERY = `
  query LivingDexReferenceData {
    pokemon_v2_generation { id name }
    pokemon_v2_region { id name }
  }
`;

const BULK_QUERY = `
  query LivingDexBulkSync {
    pokemon_v2_pokemonform {
      id
      name
      form_name
      is_battle_only
      is_mega
      is_default
      pokemon_id
      pokemon_v2_pokemonformnames(where: { language_id: { _eq: ${ENGLISH_LANGUAGE_ID} } }) {
        name
        pokemon_name
      }
      pokemon_v2_pokemonformsprites {
        sprites
      }
      pokemon_v2_versiongroup {
        name
        pokemon_v2_generation {
          id
        }
      }
      pokemon_v2_pokemon {
        id
        name
        is_default
        pokemon_v2_pokemonsprites {
          sprites
        }
        pokemon_v2_pokemonspecy {
          id
          name
          is_legendary
          is_mythical
          pokemon_v2_generation {
            id
          }
          pokemon_v2_pokemonspeciesnames(where: { language_id: { _eq: ${ENGLISH_LANGUAGE_ID} } }) {
            name
          }
        }
      }
    }
  }
`;

interface BulkForm {
  id: number;
  name: string;
  form_name: string | null;
  is_battle_only: boolean;
  is_mega: boolean;
  is_default: boolean;
  pokemon_id: number;
  pokemon_v2_pokemonformnames: { name: string; pokemon_name: string }[];
  pokemon_v2_pokemonformsprites: { sprites: unknown } | { sprites: unknown }[];
  pokemon_v2_versiongroup:
    | { name: string; pokemon_v2_generation: { id: number } | { id: number }[] }
    | { name: string; pokemon_v2_generation: { id: number } | { id: number }[] }[]
    | null;
  pokemon_v2_pokemon:
    | {
        id: number;
        name: string;
        is_default: boolean;
        pokemon_v2_pokemonsprites: { sprites: unknown } | { sprites: unknown }[];
        pokemon_v2_pokemonspecy:
          | {
              id: number;
              name: string;
              is_legendary: boolean;
              is_mythical: boolean;
              pokemon_v2_generation: { id: number } | { id: number }[];
              pokemon_v2_pokemonspeciesnames: { name: string }[];
            }
          | {
              id: number;
              name: string;
              is_legendary: boolean;
              is_mythical: boolean;
              pokemon_v2_generation: { id: number } | { id: number }[];
              pokemon_v2_pokemonspeciesnames: { name: string }[];
            }[];
      }
    | {
        id: number;
        name: string;
        is_default: boolean;
        pokemon_v2_pokemonsprites: { sprites: unknown } | { sprites: unknown }[];
        pokemon_v2_pokemonspecy: any;
      }[]
    | null;
}

interface SpeciesRow {
  id: number;
  name: string;
  display_name: string;
  generation_id: number;
  is_legendary: boolean;
  is_mythical: boolean;
  sprite_default_url: string | null;
}

interface FormRow {
  pokeapi_form_id: number;
  pokeapi_pokemon_id: number;
  species_id: number;
  form_slug: string;
  display_name: string;
  form_name: string;
  is_default_variety: boolean;
  is_battle_only: boolean;
  is_mega: boolean;
  is_gmax: boolean;
  generation_id: number | null;
  region_id: number | null;
  version_group: string | null;
  sprite_url: string | null;
  living_dex_eligible: boolean;
}

async function upsertGenerationsAndRegions(ref: ReferenceData): Promise<{ generations: number; regions: number }> {
  for (const gen of ref.pokemon_v2_generation) {
    await pool.query(
      `INSERT INTO generations (id, name, display_name) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, display_name = EXCLUDED.display_name`,
      [gen.id, gen.name, generationDisplayName(gen.name)]
    );
  }
  for (const region of ref.pokemon_v2_region) {
    await pool.query(
      `INSERT INTO regions (id, name, display_name) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, display_name = EXCLUDED.display_name`,
      [region.id, region.name, titleCase(region.name)]
    );
  }
  return { generations: ref.pokemon_v2_generation.length, regions: ref.pokemon_v2_region.length };
}

function extractRows(
  bulk: BulkForm[]
): { speciesRows: Map<number, SpeciesRow>; formRows: FormRow[]; skipped: SyncSummary['skipped'] } {
  const speciesRows = new Map<number, SpeciesRow>();
  const formRows: FormRow[] = [];
  const skipped: SyncSummary['skipped'] = [];

  for (const form of bulk) {
    try {
      const pokemon = firstOrSelf(form.pokemon_v2_pokemon);
      if (!pokemon) throw new Error('forma sem variedade (pokemon) associada');
      const specy = firstOrSelf(pokemon.pokemon_v2_pokemonspecy);
      if (!specy) throw new Error('variedade sem espécie associada');

      const speciesGeneration = firstOrSelf(specy.pokemon_v2_generation);
      if (!speciesGeneration) throw new Error('espécie sem geração de origem');

      const speciesNameRow = (specy.pokemon_v2_pokemonspeciesnames || [])[0];
      const speciesDisplayName = speciesNameRow?.name || titleCase(specy.name);

      const pokemonSprites = firstOrSelf(pokemon.pokemon_v2_pokemonsprites);
      const speciesArtworkUrl = pokemon.is_default
        ? extractSpriteUrl(pokemonSprites?.sprites, true)
        : null;

      const existingSpecies = speciesRows.get(specy.id);
      speciesRows.set(specy.id, {
        id: specy.id,
        name: specy.name,
        display_name: speciesDisplayName,
        generation_id: speciesGeneration.id,
        is_legendary: !!specy.is_legendary,
        is_mythical: !!specy.is_mythical,
        sprite_default_url: speciesArtworkUrl ?? existingSpecies?.sprite_default_url ?? null,
      });

      const versionGroup = firstOrSelf(form.pokemon_v2_versiongroup);
      const generation = versionGroup ? firstOrSelf(versionGroup.pokemon_v2_generation) : null;

      const formNameRow = (form.pokemon_v2_pokemonformnames || [])[0];
      const formDisplayName =
        (formNameRow?.pokemon_name && formNameRow.pokemon_name.trim()) || speciesDisplayName;

      const formSprites = firstOrSelf(form.pokemon_v2_pokemonformsprites);
      const formSpriteUrl = extractSpriteUrl(formSprites?.sprites, false) ?? speciesArtworkUrl;

      const formSlug = form.name;
      const isGmax = formSlug.endsWith('-gmax') || form.form_name === 'gmax';

      formRows.push({
        pokeapi_form_id: form.id,
        pokeapi_pokemon_id: pokemon.id,
        species_id: specy.id,
        form_slug: formSlug,
        display_name: formDisplayName,
        form_name: form.form_name ?? '',
        is_default_variety: !!pokemon.is_default,
        is_battle_only: !!form.is_battle_only,
        is_mega: !!form.is_mega,
        is_gmax: isGmax,
        generation_id: generation?.id ?? null,
        region_id: null, // preenchido depois via generation -> main_region (ver syncPokemonData)
        version_group: versionGroup?.name ?? null,
        sprite_url: formSpriteUrl,
        living_dex_eligible: !form.is_battle_only,
      });
    } catch (err) {
      skipped.push({
        pokeapi_form_id: form?.id ?? null,
        form_slug: form?.name ?? null,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { speciesRows, formRows, skipped };
}

async function fetchGenerationRegionMap(): Promise<Map<number, number>> {
  const query = `
    query GenerationRegions {
      pokemon_v2_generation {
        id
        pokemon_v2_region {
          id
        }
      }
    }
  `;
  const data = await graphqlRequest<{ pokemon_v2_generation: { id: number; pokemon_v2_region: { id: number } | { id: number }[] | null }[] }>(
    query
  );
  const map = new Map<number, number>();
  for (const gen of data.pokemon_v2_generation) {
    const region = firstOrSelf(gen.pokemon_v2_region);
    if (region) map.set(gen.id, region.id);
  }
  return map;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function upsertSpecies(speciesRows: SpeciesRow[]): Promise<void> {
  for (const batch of chunk(speciesRows, 300)) {
    const values: unknown[] = [];
    const rowsSql: string[] = [];
    batch.forEach((s, i) => {
      const base = i * 7;
      rowsSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`
      );
      values.push(
        s.id,
        s.name,
        s.display_name,
        s.generation_id,
        s.is_legendary,
        s.is_mythical,
        s.sprite_default_url
      );
    });
    await pool.query(
      `INSERT INTO species (id, name, display_name, generation_id, is_legendary, is_mythical, sprite_default_url)
       VALUES ${rowsSql.join(',')}
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         display_name = EXCLUDED.display_name,
         generation_id = EXCLUDED.generation_id,
         is_legendary = EXCLUDED.is_legendary,
         is_mythical = EXCLUDED.is_mythical,
         sprite_default_url = COALESCE(EXCLUDED.sprite_default_url, species.sprite_default_url),
         updated_at = now()`,
      values
    );
  }
}

async function upsertForms(formRows: FormRow[]): Promise<void> {
  for (const batch of chunk(formRows, 300)) {
    const values: unknown[] = [];
    const rowsSql: string[] = [];
    batch.forEach((f, i) => {
      const base = i * 14;
      rowsSql.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`
      );
      values.push(
        f.pokeapi_form_id,
        f.pokeapi_pokemon_id,
        f.species_id,
        f.form_slug,
        f.display_name,
        f.form_name,
        f.is_default_variety,
        f.is_battle_only,
        f.is_mega,
        f.is_gmax,
        f.generation_id,
        f.region_id,
        f.version_group,
        f.sprite_url
      );
    });
    await pool.query(
      `INSERT INTO forms (
         pokeapi_form_id, pokeapi_pokemon_id, species_id, form_slug, display_name, form_name,
         is_default_variety, is_battle_only, is_mega, is_gmax, generation_id, region_id, version_group, sprite_url
       )
       VALUES ${rowsSql.join(',')}
       ON CONFLICT (pokeapi_form_id) DO UPDATE SET
         pokeapi_pokemon_id = EXCLUDED.pokeapi_pokemon_id,
         species_id = EXCLUDED.species_id,
         form_slug = EXCLUDED.form_slug,
         display_name = EXCLUDED.display_name,
         form_name = EXCLUDED.form_name,
         is_default_variety = EXCLUDED.is_default_variety,
         is_battle_only = EXCLUDED.is_battle_only,
         is_mega = EXCLUDED.is_mega,
         is_gmax = EXCLUDED.is_gmax,
         generation_id = EXCLUDED.generation_id,
         region_id = EXCLUDED.region_id,
         version_group = EXCLUDED.version_group,
         sprite_url = COALESCE(EXCLUDED.sprite_url, forms.sprite_url),
         updated_at = now()`,
      values
    );
  }

  // living_dex_eligible é setado à parte, respeitando override manual do usuário.
  for (const batch of chunk(formRows, 300)) {
    const values: unknown[] = [];
    const rowsSql: string[] = [];
    batch.forEach((f, i) => {
      const base = i * 2;
      rowsSql.push(`($${base + 1}::integer, $${base + 2}::boolean)`);
      values.push(f.pokeapi_form_id, f.living_dex_eligible);
    });
    await pool.query(
      `UPDATE forms AS f SET
         living_dex_eligible = CASE WHEN f.living_dex_eligible_overridden
                                     THEN f.living_dex_eligible
                                     ELSE v.eligible
                                END
       FROM (VALUES ${rowsSql.join(',')}) AS v(pokeapi_form_id, eligible)
       WHERE f.pokeapi_form_id = v.pokeapi_form_id`,
      values
    );
  }
}

async function backfillCollectionEntries(): Promise<void> {
  await pool.query(`
    INSERT INTO collection_entries (form_id)
    SELECT f.id FROM forms f
    LEFT JOIN collection_entries c ON c.form_id = f.id
    WHERE c.form_id IS NULL
  `);
}

export async function syncPokemonData(): Promise<SyncSummary> {
  const start = Date.now();

  const [ref, genRegionMap] = await Promise.all([
    graphqlRequest<ReferenceData>(REFERENCE_QUERY),
    fetchGenerationRegionMap(),
  ]);
  const { generations, regions } = await upsertGenerationsAndRegions(ref);

  const bulkData = await graphqlRequest<{ pokemon_v2_pokemonform: BulkForm[] }>(BULK_QUERY);
  const { speciesRows, formRows, skipped } = extractRows(bulkData.pokemon_v2_pokemonform);

  for (const form of formRows) {
    if (form.generation_id != null) {
      form.region_id = genRegionMap.get(form.generation_id) ?? null;
    }
  }

  await upsertSpecies(Array.from(speciesRows.values()));
  await upsertForms(formRows);
  await backfillCollectionEntries();

  return {
    generations,
    regions,
    species_upserted: speciesRows.size,
    forms_upserted: formRows.length,
    forms_skipped: skipped.length,
    skipped,
    duration_ms: Date.now() - start,
  };
}
