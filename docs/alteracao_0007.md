# Alteração 0007 — Filtro de raridade na busca de carta

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
Adicionado um terceiro filtro na busca de carta do painel de detalhe: **Raridade**. A Pokémon TCG API não tem só "normal/raro/super raro/promo" — tem 37 raridades distintas (`Common`, `Uncommon`, `Rare`, `Rare Holo`, `Rare Holo GX`, `Rare Secret`, `Ultra Rare`, `Promo`, etc.), então a lista de opções é buscada dinamicamente da API (`GET /v2/rarities`) em vez de fixada no código — evita que o filtro fique desatualizado quando a API adicionar raridades novas (ex: sets recentes).

- Backend: `listRarities()` em `backend/src/services/tcgApi.ts` proxya `GET /v2/rarities`; nova rota `GET /api/tcg-cards/rarities`. `searchCards()` ganhou o parâmetro `rarity` (`rarity:"X"` na query da TCG API). `GET /api/tcg-cards/search` aceita `&rarity=` e agora exige ao menos um entre `name`/`number`/`rarity`.
- Frontend: `FormDetailPanel.tsx` busca a lista de raridades uma vez (junto com o status da chave) e mostra um `<select>` "Raridade" na busca. Como a lista completa é longa e pouco intuitiva, cada opção ganha um símbolo agrupador — `●` Common, `◆` Uncommon, `★` Rare, `🎟` qualquer Promo, `✦` para o resto (holo/EX/GX/V/secreta/ultra/etc, a categoria "super raro" do usuário) — só para leitura visual; o filtro em si usa a string exata da API. O mesmo símbolo aparece nos resultados da busca e na carta já anexada.

Testado no navegador: busca combinada "Rattata" + raridade "Common" retornou só cartas Common (confirmado nos 8 primeiros resultados).

## Motivação
Pedido do usuário: refinar a busca de carta por raridade, já que cartas físicas têm um símbolo impresso indicando a raridade (círculo/diamante/estrela/etc) e isso ajuda a achar o print exato mais rápido, principalmente quando o nome sozinho traz dezenas de resultados.

## Arquivos modificados
- `backend/src/services/tcgApi.ts`, `backend/src/routes/tcgCards.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/index.css`
