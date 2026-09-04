export type FormStatus = 'visible' | 'hidden' | 'no_need' | 'card_unavailable';
export type StatusFilter = FormStatus | 'all';
export type ViewMode = 'grid' | 'list' | 'album';
export type BinderFilter = number | 'none';
export type CollectionStatusFilter = 'missing' | 'owned' | 'definitive' | 'trade';

export interface Generation {
  id: number;
  name: string;
  display_name: string;
}

export interface Region {
  id: number;
  name: string;
  display_name: string;
}

export interface Binder {
  id: number;
  name: string;
  sort_order: number;
}

export interface FormEntry {
  id: number;
  pokeapi_form_id: number;
  form_slug: string;
  display_name: string;
  display_name_overridden: boolean;
  form_name: string;
  sprite_url: string | null;
  is_battle_only: boolean;
  is_mega: boolean;
  is_gmax: boolean;
  is_default_variety: boolean;
  status: FormStatus;
  status_overridden: boolean;
  generation_id: number | null;
  generation_display_name: string | null;
  region_id: number | null;
  region_display_name: string | null;
  species_id: number;
  species_name: string;
  species_display_name: string;
  species_sprite_default_url: string | null;
  owned: boolean;
  is_definitive: boolean;
  needs_trade: boolean;
  notes: string | null;
  tcg_card_id: string | null;
  tcg_card_name: string | null;
  tcg_card_set_name: string | null;
  tcg_card_number: string | null;
  tcg_card_rarity: string | null;
  tcg_card_image_small_url: string | null;
  tcg_card_image_large_url: string | null;
  binder_id: number | null;
  binder_name: string | null;
  binder_page: number | null;
  binder_slot: number | null;
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

export interface SyncSummary {
  generations: number;
  regions: number;
  species_upserted: number;
  forms_upserted: number;
  forms_skipped: number;
  skipped: { pokeapi_form_id: number | null; form_slug: string | null; reason: string }[];
  duration_ms: number;
}

export interface CollectionEntryUpdate {
  form_id: number;
  owned: boolean;
  is_definitive: boolean;
  needs_trade: boolean;
  notes: string | null;
  tcg_card_id: string | null;
  binder_id: number | null;
  binder_page: number | null;
  binder_slot: number | null;
  updated_at: string;
}
