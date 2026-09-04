# Alteração 0016 — Cadastro de fichários físicos e atribuição em lote
**Data:** 2026-08-22
**Tipo:** feat

## O que foi alterado
- Nova tabela `binders` (`id`, `name` único, `sort_order`) e coluna `collection_entries.binder_id` (FK para `binders`, `ON DELETE SET NULL`) — migração `003_binders.sql`.
- Backend: nova rota `backend/src/routes/binders.ts` (CRUD: `GET/POST /api/binders`, `PATCH/DELETE /api/binders/:id`), registrada em `index.ts`. `PUT /api/collection/:formId` passou a aceitar `binder_id` no corpo. `GET /api/forms` passou a aceitar filtro `binder_id` e a retornar `binder_id`/`binder_name` (join com `binders`).
- Frontend:
  - `BinderManagerModal.tsx` (novo): CRUD de fichários (criar, renomear, remover), acessível pelo botão "Gerenciar fichários" no Toolbar.
  - `Toolbar.tsx`: novo filtro "Fichário" (mesmo padrão de Geração/Região) e o botão "Gerenciar fichários".
  - `FormDetailPanel.tsx`: campo "Fichário onde está guardada" — um `<select>` na seção Coleção, desabilitado enquanto a forma não está marcada como possuída, salvando junto com o resto (auto-save, mesmo padrão dos checkboxes existentes).
  - `ListView.tsx`: nova coluna "Fichário" na tabela e uma segunda linha na barra de seleção em lote (`bulk-bar`) para aplicar um fichário a várias formas selecionadas de uma vez.
  - `BinderPage.tsx`: carrega/atualiza a lista de fichários, filtra formas por `binder_id`, e implementa `handleBulkSetBinder` (mesmo padrão de `Promise.all` já usado por `handleBulkSetStatus`).

## Motivação
O usuário guarda as cartas fisicamente espalhadas em vários fichários reais — ex: das 4 formas do Castform (mesma geração/região), só uma fica no fichário "principal" da geração, as outras 3 vão para outros fichários. Não havia como registrar isso no app. A seleção em lote na Lista já existia para status (`handleBulkSetStatus`); o mesmo mecanismo foi reaproveitado para fichário, já que o caso de uso central é marcar várias formas de uma vez.

Nomenclatura: a UI já usa "Fichário" como nome da visão em grade paginada (3x3) que existia antes. O novo conceito é sobre fichários físicos reais, mas o rótulo é o mesmo palavreado que o usuário já usa — o contexto (aba de troca de visão vs. campo de coleção/filtro) evita ambiguidade na prática.

## Arquivos modificados
- `backend/src/migrations/003_binders.sql` (novo)
- `backend/src/routes/binders.ts` (novo)
- `backend/src/routes/collection.ts`
- `backend/src/routes/forms.ts`
- `backend/src/index.ts`
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/BinderManagerModal.tsx` (novo)
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/components/ListView.tsx`
- `frontend/src/components/BinderPage.tsx`
- `frontend/src/index.css`
