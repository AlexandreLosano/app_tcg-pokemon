# Alteração 0009 — Status de forma com 4 categorias (não só oculta/visível)

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
`forms.living_dex_eligible` (boolean) virou `forms.status` (texto), com 4 categorias:

- **`visible`** — conta como slot ativo da Living Dex (padrão).
- **`hidden`** — não conta como slot separado (era `living_dex_eligible = false`, ex: Pikachus de roupinha).
- **`no_need`** *(nova)* — "Sem necessidade": existe carta, mas não é prioridade comprar agora (ex: formas Mega).
- **`card_unavailable`** *(nova)* — "Sem carta ainda": forma que o usuário quer ter, mas ainda não existe carta impressa (ex: Blue Plumage Squawkabilly).

`forms.living_dex_eligible_overridden` virou `forms.status_overridden`, com o mesmo papel: trava o valor contra o próximo sync. Migração `002_form_status.sql` migrou os dados existentes (`living_dex_eligible = false` → `status = 'hidden'`) sem perda — confirmado no banco (191 formas ocultas preservadas do uso real do usuário).

### Backend
- `GET /api/forms` trocou `eligibility=eligible|all|hidden` por `status=visible|all|hidden|no_need|card_unavailable` (padrão `visible`).
- `PATCH /api/forms/:id/eligibility` virou `PATCH /api/forms/:id/status`, body `{ status }`.
- `pokeSync.ts`: o sync só decide entre `visible`/`hidden` por padrão (via `is_battle_only`) — `no_need`/`card_unavailable` são exclusivamente escolhas manuais do usuário e nunca são sobrescritas (mesma lógica de override de antes, adaptada pro novo campo texto).

### Frontend
- Filtro "Elegibilidade" da toolbar virou "Status", com 5 opções: Visíveis / Todas / Ocultas / Sem necessidade / Sem carta ainda.
- Botão rápido ✕/↺ nos cards (Grade/Lista/Fichário) continua fazendo só a ação mais comum — alternar entre visível e oculta — sem precisar abrir o painel.
- Painel de detalhe: a antiga checkbox "Contar esta forma como slot separado" virou um seletor de 4 opções com descrição de cada categoria.
- Um badge (`Oculta`/`Sem necessidade`/`Sem carta ainda`) aparece nos cards/linhas quando a forma não está em `visible`, nas três views.

Testado no navegador com os exemplos pedidos: **Mega Charizard X** marcado como "Sem necessidade" (some do filtro Ocultas, aparece no filtro Sem necessidade) e **Blue Plumage Squawkabilly** marcado como "Sem carta ainda" (badge visível na Grade e na Lista). Ambos confirmados fora do filtro padrão "Visíveis".

## Motivação
Pedido do usuário: além de ocultar formas irrelevantes, precisava distinguir "existe carta mas não é prioridade agora" (ex: Megas) de "quero ter mas ainda não foi impressa" (ex: formas recém-lançadas em Paldea) — categorias com significado bem diferente de simplesmente "oculta".

## Arquivos modificados
- `backend/src/migrations/002_form_status.sql` (novo)
- `backend/src/services/pokeSync.ts`, `backend/src/routes/forms.ts`
- `frontend/src/types/index.ts`, `frontend/src/api/client.ts`, `frontend/src/utils/formDisplay.ts`
- `frontend/src/components/Toolbar.tsx`, `BinderPage.tsx`, `BinderGrid.tsx`, `ListView.tsx`, `AlbumView.tsx`, `FormDetailPanel.tsx`
- `frontend/src/index.css`
