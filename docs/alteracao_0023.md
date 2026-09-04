# Alteração 0023 — Posição manual (página + slot) na visão Fichário, por fichário
**Data:** 2026-08-23
**Tipo:** feat

## O que foi alterado
- `backend/src/migrations/007_binder_position.sql`: `collection_entries.binder_page`/`binder_slot` (SMALLINT, `binder_slot` entre 1-9). Índice único parcial em `(binder_id, binder_page, binder_slot)` — duas formas não podem ocupar a mesma página/posição no mesmo fichário.
- `backend/src/routes/forms.ts`: `SELECT_FORM_SQL` retorna `ce.binder_page`/`ce.binder_slot`.
- `backend/src/routes/collection.ts`: `PUT /api/collection/:formId` aceita `binder_page`/`binder_slot`. Trocar (ou remover) o `binder_id` sem informar página/posição nova zera as antigas (não fazem sentido presas a um fichário diferente). Violação do índice único (dois cards na mesma posição) responde `409` com mensagem amigável, em vez de vazar o erro do Postgres.
- `frontend/src/api/client.ts`: **corrigido bug preexistente** — os helpers `get/put/patch/post/del` nunca liam o corpo JSON de erro do backend, só mostravam "PUT /x failed: 409" genérico. Agora todos usam `errorMessage()` para tentar extrair `{ error: "..." }` da resposta antes de cair no fallback genérico — necessário para a mensagem de conflito de posição (e beneficia todo erro já existente no app, ex: nome de fichário duplicado).
- `frontend/src/components/FormDetailPanel.tsx`: campos "Página" e "Posição (1-9)" aparecem logo abaixo do select de fichário sempre que uma forma tem `binder_id` definido; salvam ao perder o foco (mesmo padrão de Notas), mostrando erro inline em caso de conflito.
- `frontend/src/components/AlbumView.tsx`: recebe a prop `binderId` (filtro atual do Toolbar). Quando o filtro aponta para **um** fichário específico e pelo menos uma forma dele tem posição definida, a paginação usa essa posição manual (uma página por número, formas nos slots 1-9 escolhidos) em vez da paginação sequencial padrão; formas do mesmo fichário sem posição definida continuam aparecendo, em páginas extras logo depois das manuais. Sem filtro de fichário específico, ou sem nenhuma posição definida, o comportamento é o de sempre (inalterado).
- `frontend/src/components/BinderPage.tsx`: passa `binderId` para `AlbumView`; `handleBulkSetBinder` zera `binder_page`/`binder_slot` no estado local ao trocar o fichário em lote (mesma normalização do backend).

## Motivação
Usuário quer que o fichário físico "15. Alternativas Originais" (que reúne formas de espécies bem diferentes, sem relação de ordem natural pela dex) seja espelhado na visão "Fichário" do app exatamente como está fisicamente organizado — página e posição (grade 3x3) escolhidas à mão. O mecanismo é genérico (funciona pra qualquer fichário), mas só faz diferença para os fichários onde o usuário efetivamente definir posições.

Testado o ciclo completo no navegador: posicionar duas formas do Castform em slots específicos da página 1, confirmar que a paginação reflete exatamente isso (demais slots vazios, formas sem posição empurradas para páginas seguintes), e testar a colisão de posição (erro 409 com mensagem amigável). Dados de teste revertidos ao final.

## Arquivos modificados
- `backend/src/migrations/007_binder_position.sql` (novo)
- `backend/src/routes/forms.ts`
- `backend/src/routes/collection.ts`
- `frontend/src/api/client.ts`
- `frontend/src/types/index.ts`
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/components/AlbumView.tsx`
- `frontend/src/components/BinderPage.tsx`
- `frontend/src/index.css`
