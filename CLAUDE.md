# Living Dex TCG Pokémon — Guia de Desenvolvimento

## Regras Obrigatórias

### 1. Documentação de Alterações
Toda alteração de código deve ser documentada em `/docs/alteracao_XXXX.md` (número sequencial com 4 dígitos). Próximo número: **0002**.

Formato:
```
# Alteração XXXX — <título>
**Data:** YYYY-MM-DD
**Tipo:** feat | fix | refactor | chore
## O que foi alterado
## Motivação
## Arquivos modificados
```

### 2. Docker — tudo containerizado
- Nunca rodar nada local (sem `npm run dev` fora do Docker, sem `psql` local, etc.)
- Usar `docker compose up` para subir o ambiente
- Usar `docker compose exec` para acessar containers

Comandos úteis:
```bash
docker compose -p app_tcg_pokemon_dev up -d                                # Sobe todos os serviços em background
docker compose -p app_tcg_pokemon_dev up --build -d                        # Rebuild e sobe
docker compose -p app_tcg_pokemon_dev exec backend sh                      # Shell no backend
docker compose -p app_tcg_pokemon_dev exec db psql -U tcg_user -d tcg_db   # Acesso ao banco
docker compose -p app_tcg_pokemon_dev logs -f backend                      # Logs do backend
docker compose -p app_tcg_pokemon_dev up --build -d backend                # Rebuild só o backend
```

### 3. Banco de Dados
- PostgreSQL exclusivamente
- Migrações em `backend/src/migrations/` numeradas sequencialmente
- Nunca alterar migração já aplicada — sempre criar nova
- O backend aplica migrações automaticamente no startup (`runMigrations()` em `db.ts`)

### 4. Stack
- **Frontend:** React + Vite + TypeScript + CSS puro (sem framework CSS)
- **Backend:** Node.js + TypeScript + Express + pg (node-postgres)
- **Banco:** PostgreSQL 16
- **Containerização:** Docker + Docker Compose
- **Deploy:** só local — este projeto não tem pipeline de PRD/GitHub Actions

### 5. Reflexo imediato no DEV após qualquer alteração
Após concluir qualquer alteração de código (edição de arquivo), reconstruir e subir o ambiente DEV **imediatamente**, sem esperar confirmação:

```bash
docker compose -p app_tcg_pokemon_dev up --build -d
```

- Se apenas o backend foi alterado: `docker compose -p app_tcg_pokemon_dev up --build -d backend`
- Se apenas o frontend foi alterado: `docker compose -p app_tcg_pokemon_dev up --build -d frontend`
- Aguardar o container ficar saudável e informar ao usuário que o DEV foi atualizado.

### 6. Portas (host)
Definidas em `.env` — evitar conflito com outros projetos (`app_idle` usa 13000/15173/15432):
- Frontend: `25173`
- Backend: `23000`
- Postgres: `25432`

---

## Modelo de Dados — Living Dex

**A regra central do projeto**: geração e região vivem na tabela `forms` (por forma/variedade), **nunca** em `species`. `pokemon-species.generation` na PokéAPI é só a geração de origem da espécie, não de cada forma — usá-la para o filtro faria Meowth aparecer errado.

Cadeia de derivação usada no sync (`backend/src/services/pokeSync.ts`): `pokemon-form → version_group → generation → main_region`.

Exemplos de referência:
- **Meowth**: 3 formas, 3 gerações/regiões diferentes (Kanto/I, Alola/VII, Galar/VIII).
- **Castform**: 4 formas, todas na mesma geração/região (Hoenn/III).
- **Unown**: 28 formas-letra sob uma única variedade — tratado corretamente porque o sync itera diretamente sobre `pokemon-form`, não assume 1 forma por variedade.

### Elegibilidade (`forms.living_dex_eligible`)
No sync, o valor inicial é `NOT is_battle_only` (vindo da PokéAPI). **Gap conhecido**: isso marca as formas de clima do Castform (Sunny/Rainy/Snowy) como não elegíveis por padrão, mesmo que o usuário queira contá-las — ajustar manualmente pelo toggle "Contar esta forma como slot separado" no painel de detalhe. Uma vez alternado manualmente, `living_dex_eligible_overridden = true` e o sync nunca mais sobrescreve esse valor.

### Coleção (`collection_entries`)
Três flags por forma — `owned`, `is_definitive`, `needs_trade` — normalizadas **no servidor** (`PUT /api/collection/:formId`, ver `backend/src/routes/collection.ts`):
```
if (!owned) { is_definitive = false; needs_trade = false; }
if (needs_trade) { owned = true; is_definitive = false; }
if (is_definitive) { needs_trade = false; }
```

### Cartas TCG (`tcg_cards`)
Cache local da carta escolhida pelo usuário via busca na Pokémon TCG API. Anexar uma carta **não** marca `owned` automaticamente (a carta pode ser um alvo/wishlist antes de ser fisicamente adquirida).

### Chave da Pokémon TCG API
Opcional (`POKEMON_TCG_API_KEY` em `.env`). Sem ela, `GET /api/tcg-cards/status` retorna `configured: false` e a busca fica desabilitada na UI — o resto do app funciona normalmente. Obter uma chave gratuita em https://dev.pokemontcg.io (sem chave: 1000 req/dia; com chave: 20.000 req/dia).

---

## Estrutura do Projeto

```
app_tcg-pokemon/
├── CLAUDE.md
├── docker-compose.yml
├── .env.example
├── docs/
│   └── alteracao_0001.md ...
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── index.css
│       ├── types/index.ts
│       ├── api/client.ts
│       └── components/
│           ├── BinderPage.tsx
│           ├── Toolbar.tsx
│           ├── BinderGrid.tsx
│           └── FormDetailPanel.tsx
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── db.ts
        ├── services/
        │   ├── pokeSync.ts      -- sync GraphQL contra a PokéAPI
        │   └── tcgApi.ts         -- proxy com retry contra a Pokémon TCG API
        ├── routes/
        │   ├── generations.ts, regions.ts, species.ts
        │   ├── forms.ts          -- endpoint principal do fichário (filtros)
        │   ├── collection.ts     -- coleção + anexar/remover carta
        │   ├── tcgCards.ts       -- status/busca de cartas
        │   └── sync.ts
        └── migrations/
            └── 001_initial.sql
```

## Rotas de Backend

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | healthcheck Docker |
| GET | `/api/generations`, `/api/regions` | listas de referência |
| GET | `/api/species`, `/api/species/:id` | espécies |
| GET | `/api/forms?generation_id=&region_id=&eligible_only=` | endpoint principal do fichário |
| PATCH | `/api/forms/:id/eligibility` | `{ living_dex_eligible }` |
| PUT | `/api/collection/:formId` | `{ owned?, is_definitive?, needs_trade?, notes? }` |
| POST | `/api/collection/:formId/attach-card` | anexa carta escolhida |
| DELETE | `/api/collection/:formId/detach-card` | remove vínculo de carta |
| GET | `/api/tcg-cards/status` | `{ configured: boolean }` |
| GET | `/api/tcg-cards/search?name=` | proxy de busca na Pokémon TCG API |
| POST | `/api/sync/pokemon` | roda o sync completo contra a PokéAPI |
