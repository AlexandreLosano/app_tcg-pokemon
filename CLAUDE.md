# Living Dex TCG Pokémon — Guia de Desenvolvimento

## Regras Obrigatórias

### 1. Documentação de Alterações
Toda alteração de código deve ser documentada em `/docs/alteracao_XXXX.md` (número sequencial com 4 dígitos). Próximo número: **0026**.

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

### Status da forma (`forms.status`)
Quatro categorias: `visible` (padrão, conta como slot ativo), `hidden` (não conta, ex: forma cosmética), `no_need` (existe carta, mas não é prioridade comprar agora, ex: formas Mega), `card_unavailable` (quero ter, mas ainda não existe carta impressa, ex: formas recém-lançadas). No sync, o valor inicial só varia entre `visible`/`hidden`, via `NOT is_battle_only` (vindo da PokéAPI) — `no_need`/`card_unavailable` são escolhas exclusivamente manuais, nunca atribuídas pelo sync. **Gap conhecido**: isso marca as formas de clima do Castform (Sunny/Rainy/Snowy) como `hidden` por padrão, mesmo que o usuário queira contá-las — ajustar manualmente no seletor de status do painel de detalhe. Uma vez alternado manualmente (qualquer uma das 4 categorias), `status_overridden = true` e o sync nunca mais sobrescreve esse valor.

### Nome de exibição (`forms.display_name`)
Editável pelo usuário direto no título do painel de detalhe (campo de texto, salva ao perder o foco). Mesmo padrão de `status_overridden`: uma vez editado manualmente, `display_name_overridden = true` e o sync (`PATCH /api/forms/:id/display-name`) nunca mais sobrescreve — sem isso, o próximo "Atualizar" traria o nome original da PokéAPI de volta.

### Coleção (`collection_entries`)
Três flags por forma — `owned`, `is_definitive`, `needs_trade` — normalizadas **no servidor** (`PUT /api/collection/:formId`, ver `backend/src/routes/collection.ts`):
```
if (!owned) { is_definitive = false; needs_trade = false; }
if (needs_trade) { owned = true; is_definitive = false; }
if (is_definitive) { needs_trade = false; }
```

### Cartas TCG (`tcg_cards`)
Cache local da carta escolhida pelo usuário via busca na Pokémon TCG API. Anexar uma carta **não** marca `owned` automaticamente (a carta pode ser um alvo/wishlist antes de ser fisicamente adquirida). `POST /api/collection/:formId/attach-card` aceita qualquer objeto de carta (`id`, `name`, `images.small` obrigatórios) — não só resultado de busca. Quando a Pokémon TCG API não tem o print indexado (comum em sets regionais/promocionais), a UI oferece cadastro manual (nome, número, set, raridade, URL da imagem) que usa esse mesmo endpoint, com `id` gerado por `generateManualCardId()` (`manual-` + `Date.now().toString(36)` + sufixo `Math.random()` — **não** `crypto.randomUUID()`, que exige contexto seguro/HTTPS e falha ao acessar o app por IP na rede local; prefixo `manual-` identifica a carta como não vinda da API — mesma badge visual dos outros "cadastrados manualmente" do app). `tcg_cards.id`/`collection_entries.tcg_card_id` são `VARCHAR(64)` (não `VARCHAR(30)`, que estourava com ids manuais mais longos).

### Fichários físicos (`binders`, `collection_entries.binder_id`)
Cadastro dos fichários reais onde as cartas ficam guardadas (CRUD em `backend/src/routes/binders.ts`, UI em `BinderManagerModal.tsx`, acessível pelo botão "Gerenciar fichários" no Toolbar). Cada `collection_entries` aponta para no máximo um fichário via `binder_id` (nullable, `ON DELETE SET NULL` — apagar um fichário só desvincula as formas, não apaga nada). Caso de uso central: formas alternativas da mesma geração/região nem sempre ficam juntas fisicamente — ex. as 4 formas do Castform (mesma geração) podem estar espalhadas em fichários diferentes. Editável forma a forma no painel de detalhe (campo sempre habilitado, independente de `owned` — decidir o fichário não depende de já ter marcado que possui a carta) ou em lote pela Lista (`ListView.tsx`, mesmo mecanismo de seleção usado para status em massa). Não confundir com a visão "Fichário" do seletor Grade/Lista/Fichário — aquela é só um estilo de exibição da coleção, sem relação com os fichários físicos cadastrados aqui.

**Posição manual (`binder_page`/`binder_slot`)**: opcional, também editável no painel de detalhe (campos "Página"/"Posição" aparecem quando a forma tem `binder_id`). Só entra em jogo na visão "Fichário" (`AlbumView.tsx`) quando o filtro do Toolbar está travado num fichário específico (não "Todos" nem "Sem fichário") e pelo menos uma forma dele tem posição definida — nesse caso a paginação segue a posição escolhida (uma página por número, slots 1-9 numa grade 3x3) em vez da ordem padrão da dex; formas sem posição definida continuam aparecendo, em páginas extras depois das manuais. Índice único em `(binder_id, binder_page, binder_slot)` impede duas formas na mesma posição (erro 409 amigável). Trocar/remover o fichário sem informar posição nova zera `binder_page`/`binder_slot` automaticamente (não fazem sentido presos a um fichário diferente).

### Chave da Pokémon TCG API
Opcional (`POKEMON_TCG_API_KEY` em `.env`). Sem ela, `GET /api/tcg-cards/status` retorna `configured: false` e a busca fica desabilitada na UI — o resto do app funciona normalmente. Obter uma chave gratuita em https://dev.pokemontcg.io (sem chave: 1000 req/dia; com chave: 20.000 req/dia).

### Slots sintéticos / formas manuais (forma sem `pokemon-form` real na PokéAPI)
Duas origens possíveis, mesmo mecanismo de fundo (`pokeapi_form_id` **negativo**, garante que nunca colide com um id real — sempre positivo — e nunca é tocado pelo `ON CONFLICT` do sync):

- **Caso raro, feito à mão via SQL**: um slot "geral" além das formas reais (ex: `unown-general`, representando o Unown como um todo além das 28 letras). `pokeapi_form_id = -species_id`. Precisa de uma linha correspondente em `collection_entries` inserida manualmente também. Ver `docs/alteracao_0010.md`.
- **Cadastro pelo próprio usuário, via UI** (`POST /api/forms/custom`, botão "Formas manuais" no Toolbar → `CustomFormManagerModal`, busca a forma base e daí escolhe o nome da variante): para variantes que a PokéAPI não modela como `pokemon-form` mas que o usuário quer rastrear como slot próprio — ex: diferença visual grande entre macho e fêmea (a PokéAPI só expõe isso via sprite `front_female`, não como forma distinta, e a maioria das diferenças de gênero são pequenas demais para importar — por isso não existe nenhum sync/detecção automática disso). A nova forma herda `species_id`/`generation_id`/`region_id` da forma base escolhida, o que já garante a posição certa na ordenação (`sp.id, f.id`) sem lógica extra. `pokeapi_form_id` vem de `custom_form_seq` (offset `-1.000.000`, decoupled de `species_id` — uma espécie pode ganhar mais de uma forma manual). Removível pelo mesmo modal (`DELETE /api/forms/:id/custom`, que só aceita `pokeapi_form_id < 0` — nunca deixa apagar uma forma real). Ver `docs/alteracao_0018.md` e `docs/alteracao_0019.md`.

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
│       ├── utils/formDisplay.ts  -- statusClass/statusLabel/imageUrl, reusado pelas 3 views
│       └── components/
│           ├── BinderPage.tsx
│           ├── Toolbar.tsx        -- filtros (inclui Fichário) + seletor Grade/Lista/Fichário
│           ├── BinderGrid.tsx     -- visão em grade (padrão)
│           ├── ListView.tsx       -- visão em lista/tabela, seleção em lote
│           ├── AlbumView.tsx      -- visão de fichário, 9 cards por página em 3x3
│           ├── FormDetailPanel.tsx
│           ├── BinderManagerModal.tsx  -- CRUD dos fichários físicos
│           ├── CustomFormManagerModal.tsx  -- cadastro/remoção de formas manuais
│           ├── ChartsPage.tsx     -- página "Gráficos", donuts por geração/região
│           └── DonutChart.tsx     -- componente SVG reutilizável
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
        │   ├── collection.ts     -- coleção + anexar/remover carta + fichário
        │   ├── tcgCards.ts       -- status/busca de cartas
        │   ├── binders.ts        -- CRUD dos fichários físicos
        │   └── sync.ts
        └── migrations/
            ├── 001_initial.sql
            ├── 002_form_status.sql
            └── 003_binders.sql
```

## Rotas de Backend

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | healthcheck Docker |
| GET | `/api/generations`, `/api/regions` | listas de referência |
| GET | `/api/species`, `/api/species/:id` | espécies |
| GET | `/api/forms?generation_id=&region_id=&binder_id=\|none&status=visible\|all\|hidden\|no_need\|card_unavailable&collection_status=missing\|owned\|definitive\|trade` | endpoint principal do fichário (`binder_id=none` filtra sem fichário; `collection_status` filtra por posse — Tenho/Definitiva/Precisa de troca/Não tenho) |
| PATCH | `/api/forms/:id/status` | `{ status }` |
| PATCH | `/api/forms/:id/display-name` | `{ display_name }` — trava contra sobrescrita do sync |
| POST | `/api/forms/custom` | `{ based_on_form_id, display_name }` — cria forma manual |
| DELETE | `/api/forms/:id/custom` | remove forma manual (só aceita `pokeapi_form_id < 0`) |
| PUT | `/api/collection/:formId` | `{ owned?, is_definitive?, needs_trade?, notes?, binder_id?, binder_page?, binder_slot? }` |
| POST | `/api/collection/:formId/attach-card` | anexa carta escolhida |
| DELETE | `/api/collection/:formId/detach-card` | remove vínculo de carta |
| GET | `/api/tcg-cards/status` | `{ configured: boolean }` |
| GET | `/api/tcg-cards/rarities` | lista de raridades válidas (proxy `GET /v2/rarities`) |
| GET | `/api/tcg-cards/search?name=&number=&rarity=` | proxy de busca na Pokémon TCG API (ao menos um dos três) |
| GET/POST | `/api/binders` | lista / cria fichário físico (`{ name }`) |
| PATCH/DELETE | `/api/binders/:id` | renomeia (`{ name }`) / remove fichário |
| POST | `/api/sync/pokemon` | roda o sync completo contra a PokéAPI |
