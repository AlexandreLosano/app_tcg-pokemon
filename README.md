# Living Dex — TCG Pokémon

Fichário digital para acompanhar uma coleção física de cartas Pokémon TCG organizada como **Living Dex**: uma carta para cada forma colecionável de Pokémon, considerando que algumas formas pertencem a gerações/regiões diferentes (ex: Meowth original/Alolan/Galarian) e outras à mesma geração/região (ex: as 4 formas de clima do Castform).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + TypeScript + Express |
| Banco | PostgreSQL 16 |
| Containerização | Docker + Docker Compose |
| Dados | PokéAPI (espécies/formas/gerações/regiões) + Pokémon TCG API (cartas físicas) |

## Funcionalidades

- **Filtros por Geração e Região** — no nível da *forma*, não da espécie. Filtrar por Geração I mostra só o Meowth original; filtrar por Geração III/Hoenn mostra as 4 formas de Castform juntas. Também dá pra filtrar por status de posse (Tenho/Definitiva/Precisa de troca/Não tenho) e por fichário físico.
- **Botão "Atualizar"** — resincroniza espécies/formas/gerações/regiões contra a PokéAPI (idempotente, roda em poucos segundos). Nomes e status editados manualmente nunca são sobrescritos pelo sync.
- **Status por forma** — 4 categorias: Visível (padrão), Oculta (não conta como slot), Sem necessidade (existe carta, mas não é prioridade agora — ex: formas Mega) e Sem carta ainda (quero ter, mas ainda não foi impressa). Ajustável rápido na grade/lista/fichário (✕/↺) ou com detalhe no painel da forma; cada categoria tem seu próprio filtro na toolbar.
- **Coleção por forma** — tenho a carta / carta definitiva (não pretendo trocar) / precisa de troca / notas livres. O nome de exibição de qualquer forma também é editável direto no painel.
- **Anexar carta física** — busca na Pokémon TCG API por nome e/ou número impresso na carta (útil quando a busca por nome não traz o print exato) e anexa a carta escolhida (arte, set, número, raridade) a cada forma. Quando a API não tem o print (comum em sets regionais/promocionais), dá pra cadastrar a carta manualmente (nome, número, set, raridade, URL da imagem).
- **Fichários físicos** — cadastro dos fichários reais onde as cartas ficam guardadas, com atribuição por forma (individual ou em lote pela Lista) e posição manual opcional (página + slot 1-9 numa grade 3x3) para fichários cuja organização física não segue a ordem da dex.
- **Formas manuais** — cadastro de variantes que a PokéAPI não modela como forma própria (ex: diferença visual grande entre macho e fêmea), baseadas numa forma existente para herdar geração/região/posição na ordenação automaticamente.
- **Três visões** — **Grade** (padrão, todas as formas filtradas), **Lista** (tabela compacta, com seleção em lote) e **Fichário** (9 cards por página em 3x3, com setas de navegação, simulando um álbum físico de 9 bolsos — respeita a posição manual quando definida).
- **Gráficos** — página com donuts de % de posse, agrupável por Geração, Região ou Fichário.

## Modelo de dados

Geração e região vivem na tabela `forms` — não em `species`. Cada forma é derivada via `pokemon-form → version_group → generation → main_region` na PokéAPI. Veja `CLAUDE.md` para os detalhes completos do modelo e das decisões de design.

## Fonte de dados

- **PokéAPI** (`beta.pokeapi.co/graphql/v1beta`) — gratuita, sem chave, usada para sincronizar espécies/formas/gerações/regiões.
- **Pokémon TCG API** (`api.pokemontcg.io`) — gratuita, usada para buscar e anexar cartas físicas. Funciona sem chave (1000 req/dia) ou com chave gratuita (20.000 req/dia, obtida em https://dev.pokemontcg.io). Sem chave configurada, a busca de cartas fica desabilitada mas o resto do app funciona normalmente.

## Pré-requisitos

- Docker e Docker Compose

## Como rodar

```bash
cp .env.example .env   # ajuste as portas se necessário
docker compose -p app_tcg_pokemon_dev up --build -d
```

Acesse `http://localhost:25173` (ou a porta definida em `FRONTEND_PORT`).

No primeiro uso, clique em **Atualizar** para popular o banco com os dados da PokéAPI. Depois, abra as 3 formas de clima do Castform (Sunny/Rainy/Snowy) e mude o status para "Visível" — esse é o único ajuste manual esperado logo após o primeiro sync.

Para habilitar a busca de cartas, adicione uma chave gratuita da Pokémon TCG API em `POKEMON_TCG_API_KEY` no `.env` e reinicie o backend.

## Comandos úteis

```bash
docker compose -p app_tcg_pokemon_dev logs -f backend
docker compose -p app_tcg_pokemon_dev exec db psql -U tcg_user -d tcg_db
docker compose -p app_tcg_pokemon_dev up --build -d backend   # rebuild só o backend
docker compose -p app_tcg_pokemon_dev up --build -d frontend  # rebuild só o frontend
```

## Banco de Dados

Migrações em `backend/src/migrations/`, aplicadas automaticamente no startup do backend. Nunca editar uma migração já aplicada — sempre criar uma nova numerada sequencialmente.

## Estrutura

```
app_tcg-pokemon/
├── docker-compose.yml
├── backend/   (Node + TypeScript + Express + pg)
├── frontend/  (React + Vite + TypeScript)
└── docs/      (alteracao_XXXX.md por mudança)
```

## Histórico de Alterações

Ver `docs/alteracao_XXXX.md` para o histórico detalhado de cada mudança no projeto.
# app_pokemon
