# Alteração 0018 — Cadastro manual de forma (ex: diferença macho/fêmea)
**Data:** 2026-08-23
**Tipo:** feat

## O que foi alterado
- `backend/src/migrations/004_custom_forms_seq.sql`: sequência `custom_form_seq`, fonte de ids negativos únicos para formas cadastradas manualmente (complementa o padrão `pokeapi_form_id = -species_id` já usado no slot "Unown (Geral)", ver `docs/alteracao_0010.md` — agora generalizado e decoupled de espécie, porque uma espécie pode ganhar mais de uma forma manual).
- `backend/src/routes/forms.ts`:
  - `SELECT_FORM_SQL` passou a retornar `f.pokeapi_form_id` (necessário no frontend para diferenciar forma real de forma manual).
  - `POST /api/forms/custom` — `{ based_on_form_id, display_name }`. Herda `species_id`, `generation_id`, `region_id` e `sprite_url` da forma base, gera `form_slug` único via slugify do nome, insere com `pokeapi_form_id` negativo (nunca colide com um id real, então o sync nunca toca essa linha) e `status_overridden = true`. Faz o backfill de `collection_entries` na hora (o sync só faz isso para formas que ele mesmo insere).
  - `DELETE /api/forms/:id/custom` — só apaga se `pokeapi_form_id < 0` (nunca deixa apagar uma forma real sincronizada).
- Frontend:
  - `types/index.ts`: `FormEntry.pokeapi_form_id`.
  - `utils/formDisplay.ts`: `isCustomForm(form)`.
  - `api/client.ts`: `forms.createCustom(basedOnFormId, displayName)`, `forms.removeCustom(formId)`.
  - `FormDetailPanel.tsx`: nova seção "Forma manual" — campo de nome + botão "Adicionar" (baseado na forma atualmente aberta); se a forma aberta já é manual, mostra o badge "cadastrada manualmente" e o botão "Remover esta forma manual".
  - `BinderPage.tsx`: `handleCustomFormCreated`/`handleCustomFormRemoved` recarregam a lista de formas (mais simples que inserir/remover localmente, já que a ordenação é feita no servidor).

## Motivação
Usuário identificou que alguns Pokémon têm diferenças visuais grandes entre macho e fêmea que ele quer rastrear como slots próprios da Living Dex — mas não quer nenhum sync/detecção automática disso, porque isso traria também as dezenas de diferenças pequenas/irrelevantes que a PokéAPI expõe via sprite `front_female` (a PokéAPI não modela diferença de gênero como `pokemon-form` na maioria dos casos, então isso nunca viria do sync de qualquer forma). A solução: cadastro 100% manual, mas resolvendo o problema de posicionamento na lista automaticamente — herdando espécie/geração/região da forma base, a ordenação (`sp.id, f.id`, já existente) já entrega a posição certa (número da dex, respeitando geração/região) sem lógica extra.

## Arquivos modificados
- `backend/src/migrations/004_custom_forms_seq.sql` (novo)
- `backend/src/routes/forms.ts`
- `frontend/src/types/index.ts`
- `frontend/src/utils/formDisplay.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/components/BinderPage.tsx`
