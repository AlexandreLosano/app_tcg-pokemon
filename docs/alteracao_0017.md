# Alteração 0017 — Opção "Sem fichário" no filtro de fichário
**Data:** 2026-08-22
**Tipo:** feat

## O que foi alterado
- `backend/src/routes/forms.ts`: `GET /api/forms?binder_id=` agora aceita o valor especial `none`, que filtra `ce.binder_id IS NULL` (em vez de comparar com um id numérico).
- `frontend/src/types/index.ts`: novo tipo `BinderFilter = number | 'none'`, usado no lugar de `number` no estado/props do filtro de fichário.
- `Toolbar.tsx`: nova opção "Sem fichário" no select de fichário (entre "Todos" e a lista de fichários cadastrados).
- `BinderPage.tsx`: `binderId` passou a aceitar `BinderFilter | undefined`; `handleBindersChanged` ajustado para só invalidar o filtro quando `binderId` é um id numérico (não faz sentido invalidar `'none'`, que não está atrelado a nenhum fichário específico); `handleBulkSetBinder` ajustado para manter/remover formas da lista corretamente ao aplicar em lote enquanto o filtro "Sem fichário" está ativo.
- `frontend/src/api/client.ts`: `forms.list` aceita `binder_id?: BinderFilter`.

## Motivação
Pedido do usuário: além de filtrar por um fichário específico, precisa localizar rapidamente as cartas que ainda não foram atribuídas a nenhum fichário físico.

## Arquivos modificados
- `backend/src/routes/forms.ts`
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/BinderPage.tsx`
