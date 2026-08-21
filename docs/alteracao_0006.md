# Alteração 0006 — Busca de carta por número, visão em Lista e Fichário 3x3

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado

### 1. Busca de carta por número
Às vezes a carta que o usuário tem não aparece na busca por nome (nomes de print variam bastante — ex: "Sunny Castform", promos, cartas sem holo/EX no nome). Adicionado um segundo campo "Número" no painel de detalhe, que pode ser usado sozinho ou combinado com o nome:
- Backend: `searchCards({ name?, number? })` em `backend/src/services/tcgApi.ts` monta a query combinando `name:"X*"` e `number:Y` conforme o que for preenchido; `pageSize` da Pokémon TCG API subiu de 25 para 50 (espécies populares como Meowth/Pikachu têm 50+ prints, o limite antigo cortava resultados). `GET /api/tcg-cards/search` agora aceita `?name=&number=`, exigindo ao menos um dos dois.
- Frontend: `FormDetailPanel.tsx` ganhou o campo "Número (ex: 58)" ao lado do nome, com dica explicando o uso, e mensagem clara quando a busca não retorna nada.
- Corrigido um bug de overflow horizontal no modal causado pelo novo campo (inputs sem `min-width: 0` não encolhiam dentro do flexbox).

### 2. Visão em Lista
Nova tela `frontend/src/components/ListView.tsx` — tabela com miniatura, nome, geração, região, status (pill colorido) e carta anexada, uma forma por linha. Clicar na linha abre o painel de detalhe; botão de ocultar rápido também disponível por linha.

### 3. Visão de Fichário (3x3 paginado)
Nova tela `frontend/src/components/AlbumView.tsx` — simula uma página de fichário físico de 9 bolsos: sempre 3x3 = 9 cards por página, com setas "Anterior"/"Próxima" e indicador "Página X de Y". Páginas incompletas (ex: a última) preenchem os slots restantes com espaços vazios tracejados, mantendo a moldura 3x3. A página volta para 1 automaticamente sempre que os filtros (geração/região/elegibilidade) mudam.

### Estrutura compartilhada
Extraído `frontend/src/utils/formDisplay.ts` (`statusClass`, `statusLabel`, `imageUrl`) para reuso entre `BinderGrid`, `ListView` e `AlbumView`, evitando duplicar a lógica de status em três lugares.

Um seletor "Grade | Lista | Fichário" foi adicionado à `Toolbar` para alternar entre as três visões.

## Motivação
Pedido do usuário: (1) nem toda carta física aparece na busca por nome, então precisa buscar pelo número impresso; (2) uma visão em lista para revisar a coleção de forma mais compacta; (3) uma visão que reproduza a experiência de folhear um fichário físico de 9 bolsos.

## Arquivos modificados
- `backend/src/services/tcgApi.ts`, `backend/src/routes/tcgCards.ts`
- `backend/src/services/pokeSync.ts` (correção de tipos `unknown` do `res.json()`, sem mudança de comportamento)
- `frontend/src/types/index.ts`, `frontend/src/api/client.ts`
- `frontend/src/components/FormDetailPanel.tsx`, `Toolbar.tsx`, `BinderPage.tsx`, `BinderGrid.tsx`
- `frontend/src/components/ListView.tsx` (novo), `AlbumView.tsx` (novo)
- `frontend/src/utils/formDisplay.ts` (novo)
- `frontend/src/index.css`
