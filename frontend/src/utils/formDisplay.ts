import type { FormEntry, FormStatus } from '../types';

// Rótulo do status da FORMA (visível/oculta/sem necessidade/sem carta) — não confundir com
// statusClass/statusLabel abaixo, que descrevem o status de POSSE da carta (tenho/definitiva/troca).
export function formStatusLabel(status: FormStatus): string {
  switch (status) {
    case 'hidden':
      return 'Oculta';
    case 'no_need':
      return 'Sem necessidade';
    case 'card_unavailable':
      return 'Sem carta ainda';
    default:
      return 'Visível';
  }
}

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

// true quando o usuário ainda não mexeu em nada nessa forma: não marcou como tenho, não
// anexou carta, não escreveu nota. is_definitive/needs_trade não precisam ser checados —
// a normalização do servidor já garante que ficam false quando owned é false.
export function hasNoRegistration(form: FormEntry): boolean {
  return !form.owned && !form.tcg_card_id && !(form.notes && form.notes.trim());
}

// Forma cadastrada manualmente pelo usuário (ex: diferença grande entre macho e fêmea), não
// sincronizada da PokéAPI — reconhecida pelo pokeapi_form_id negativo (ver POST /api/forms/custom).
export function isCustomForm(form: FormEntry): boolean {
  return form.pokeapi_form_id < 0;
}
