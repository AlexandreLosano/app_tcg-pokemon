import type { FormEntry } from '../types';

export function statusClass(form: FormEntry): string {
  if (!form.owned) return 'status-missing';
  if (form.is_definitive) return 'status-definitive';
  if (form.needs_trade) return 'status-trade';
  return 'status-owned';
}

export function statusLabel(form: FormEntry): string {
  if (!form.owned) return 'Não tenho';
  if (form.is_definitive) return 'Definitiva';
  if (form.needs_trade) return 'Precisa de troca';
  return 'Tenho';
}

export function imageUrl(form: FormEntry): string | null {
  return form.tcg_card_image_small_url ?? form.sprite_url ?? form.species_sprite_default_url ?? null;
}
