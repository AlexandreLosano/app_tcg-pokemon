# Alteração 0024 — Filtro por status de posse (Tenho/Definitiva/Precisa de troca/Não tenho)
**Data:** 2026-08-24
**Tipo:** feat

## O que foi alterado
- `backend/src/routes/forms.ts`: `GET /api/forms` aceita `collection_status` (`missing` | `owned` | `definitive` | `trade`), mesmas categorias mutuamente exclusivas de `statusClass` no frontend (`utils/formDisplay.ts`) — `missing` = não possui; `owned` = possui, não definitiva nem em troca; `definitive` = possui e definitiva; `trade` = possui e precisa de troca.
- `frontend/src/types/index.ts`: `CollectionStatusFilter`.
- `frontend/src/api/client.ts`: `forms.list` aceita `collection_status`.
- `frontend/src/components/Toolbar.tsx`: novo select "Coleção" (Todas/Tenho/Definitiva/Precisa de troca/Não tenho), ao lado do filtro "Status" já existente (que filtra `forms.status` — visível/oculta/etc, um conceito diferente).
- `frontend/src/components/BinderPage.tsx`: estado `collectionStatus`, passado pro filtro de formas e pro `key` do `AlbumView` (reseta a paginação ao trocar o filtro).

## Motivação
Usuário quer conseguir ver só as formas que já tem, só as definitivas, só as que precisam de troca, ou só as que faltam — sem precisar abrir a Lista e ler status por status.

## Arquivos modificados
- `backend/src/routes/forms.ts`
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/BinderPage.tsx`
