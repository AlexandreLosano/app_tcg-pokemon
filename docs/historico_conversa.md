# Histórico do projeto — da ideia ao app funcionando

Este documento registra a conversa completa que deu origem ao `app_tcg-pokemon`: o pedido original, as perguntas de alinhamento, as decisões tomadas e os passos de implementação, testes e ajustes. Serve como referência de "por quê" o projeto é como é, complementando o `README.md` (o quê) e o `CLAUDE.md` (como manter).

---

## 1. Pedido inicial

> Criei a pasta `/home/alosano/repos/app_tcg-pokemon`.
>
> Possuo uma coleção de TCGs de pokemon, essa coleção é para ser uma LivingDex, ou seja, uma carta para cada pokemon. Com isso tenho uma boa quantidade já. Mas tem algumas pedainhas, por exemplo o Pokemon Meowth, ele possui 3 formas, a original e de Alola e a de Galar. isso sendo de outras regiões e/ou gerações, já o Castform também possui varias formas, Normal, Sunny, Rainy e Snowy, mas todos eles foram da mesma geração/regiao. e isso deve ser conciderado para as cartas, para a coleção ser completa devo ter um de cada, isso para os 2 exemplos que te mandei.
>
> Gostaria de uma aplicação que deve registrar isso em um banco de dados. sites como o bulbapedia.bulbagarden.net possui uma pagina Pokédex que lista todos os pokemon e suas formas.
>
> A aplicaçaõ deve ter filtros de Geração e Região, quando escolher ver a Geraçaõ I por exemplo quero ver apenas os pokemon desta geração entao o Meowth por exemplo deve mostrar apenas o "original" pois os de Alola ou Galar são de outras gerações e regiões.
>
> Utilize APIs gratuitas para alimentar a ferramenta, e um Postgre para guardar isso, ou seja, deve ter um botão para atualizar a aplicação com o lançamento de novos jogos que consequentemente terá mais pokemon, geração, regiao, etc.
>
> A aplicação deve permitir que eu mencione se tenho ou não a carta, se a carta é definitiva e necessita de troca. Se for possivel com uso de apis ou scrapping de dados do site ligapokemon por exemplo, para escolher a coleçao e a carta que possuo, trazendo a arte, fazendo assim um fichario digital da coleção.
>
> Sim, pedi muita coisa, não exite em perguntar, questinar, criar agentes, tudo que for necessário, tudo referente a esse projeto deve ser salvo na pasta mencionada, e muito bem documentado, MDs avontade.

**O desafio central identificado**: o "slot" da Living Dex não é a espécie de Pokémon, é a *forma* — e duas formas do mesmo Pokémon podem ou não pertencer à mesma geração/região (Meowth: não; Castform: sim). Qualquer filtro de Geração/Região precisaria operar nesse nível.

---

## 2. Perguntas de alinhamento

Antes de planejar, três decisões de arquitetura foram levadas ao usuário:

| Pergunta | Opções apresentadas | Resposta |
|---|---|---|
| Stack técnica | Full stack (padrão app_idle: React+Vite+TS, Node+Express+TS, Postgres, Docker) **vs.** leve (padrão app_pokemon + Postgres) | **Full stack, padrão app_idle** |
| Fonte de dados de cartas | Pokémon TCG API (oficial, gratuita, estável) **vs.** scraping do LigaPokemon como fonte primária | **Pokémon TCG API** |
| Escopo de deploy | Só local (Docker Compose) **vs.** com pipeline de PRD via GitHub Actions (como o app_idle) | **Só local** |

O scraping do LigaPokemon, cogitado no pedido original, foi descartado como fonte primária por ser frágil (o site pode mudar a qualquer momento) e de legalidade incerta quanto aos termos de uso — a Pokémon TCG API cobre a mesma necessidade (arte, set, número da carta) de forma oficial e gratuita.

---

## 3. Pesquisa e planejamento

Com as decisões de stack fechadas, entrei em **modo de planejamento** (sem escrever código ainda) e rodei três investigações em paralelo antes de desenhar a solução:

1. **Convenções do `app_idle`** — Dockerfiles, `package.json`, `tsconfig.json`, o `db.ts` com o executor de migrações, o padrão de rotas Express, o proxy `/api` do Vite — tudo para replicar exatamente o mesmo estilo de projeto que o usuário já usa.
2. **PokéAPI** — verificação ao vivo (não suposição) de como a API modela espécies, variedades e formas. Descoberta crítica: `pokemon-species.generation` é só a geração de *origem* da espécie, não de cada forma — usar esse campo faria o filtro de Meowth ficar errado. A cadeia correta é `pokemon-form → version_group → generation → main_region`, confirmada ao vivo trazendo exatamente o resultado esperado: Meowth em 3 gerações/regiões diferentes, Castform em 4 formas na mesma geração/região.
3. **Pokémon TCG API** — confirmado gratuita (1000 req/dia sem chave, 20.000/dia com chave gratuita), sem SDK oficial confiável (usar `fetch` direto), e sem campo estruturado que diferencie carta de forma regional — só dá para inferir pelo nome da carta, daí a decisão de tornar o anexo de carta uma busca manual do usuário, não automática.

Um agente de design então desenhou o schema do banco, o pipeline de sincronização e a estrutura de rotas/frontend, com validação ao vivo contra a PokéAPI (inclusive descobrindo, antes mesmo de eu codar, que **as formas de clima do Castform vêm marcadas como `is_battle_only: true`** — ou seja, o usuário precisaria ativar manualmente essas 3 formas após o primeiro sync, algo documentado desde o início como comportamento esperado, não bug).

O plano final foi revisado e aprovado antes de qualquer linha de código ser escrita — ver `/home/alosano/.claude/plans/validated-questing-mist.md` para o documento completo (schema SQL, rotas, fluxo de sync).

---

## 4. Implementação

Construído na ordem: scaffold do projeto → migração inicial → serviço de sync com a PokéAPI → rotas de backend → integração com a Pokémon TCG API → frontend → documentação → commit inicial.

Pontos validados durante a construção (não só "escrito", mas testado de fato):

- **Banco**: `docker compose up`, migração aplicada, 7 tabelas criadas.
- **Sync**: primeira execução trouxe **1025 espécies, 1527 formas, 9 gerações, 10 regiões, 0 formas ignoradas**, em ~1,6 segundos. Rodado duas vezes seguidas para confirmar **idempotência** (contagens não duplicam).
- **Caso Meowth**: confirmado no banco — Meowth (Gen I/Kanto), Alolan Meowth (Gen VII/Alola), Galarian Meowth (Gen VIII/Galar), Gigantamax Meowth (não elegível por padrão).
- **Caso Castform**: confirmado no banco — as 4 formas (Normal/Sunny/Rainy/Snowy) todas em Gen III/Hoenn, as 3 de clima marcadas como não elegíveis por padrão (gap conhecido, documentado).
- **Filtros**: `GET /api/forms?generation_id=1` retornou só o Meowth original; `?generation_id=3&region_id=3` retornou as 4 formas de Castform.
- **Frontend no navegador**: testado com o `claude-in-chrome` — grid carregando, filtros de Geração/Região funcionando, painel de detalhe abrindo, toggles de posse/definitiva/troca persistindo após reload, e o aviso gracioso de "busca de cartas desabilitada" aparecendo corretamente sem a chave da TCG API configurada.
- **Documentação criada**: `README.md`, `CLAUDE.md` (com a seção "Modelo de Dados — Living Dex" explicando a regra geração/região-por-forma), `docs/alteracao_0001.md`.
- **Git**: repositório local inicializado (sem remote) com commit inicial.

Dados de teste inseridos durante a validação (ex: marcar Sunny Castform como "definitiva" só para testar o fluxo) foram **revertidos** antes de encerrar, para não deixar informação fictícia na coleção real.

---

## 5. Chave da Pokémon TCG API

O usuário perguntou se a chave era gratuita e como gerá-la. Esclarecido:
- **Gratuita**, sem cartão de crédito — cadastro simples em `dev.pokemontcg.io`.
- Também esclarecida uma dúvida importante: `dev.pokemontcg.io` **não** é um ambiente de "desenvolvimento" separado de uma "produção" — é só o portal onde se gera a chave. A API que o app realmente consome (`api.pokemontcg.io/v2`) já é a "de produção" desde o início; a chave apenas autentica as chamadas a ela.

O usuário gerou a chave e configurou no `.env`. O backend foi reiniciado para carregar a variável, e confirmado via `GET /api/tcg-cards/status` → `{"configured": true}`, seguido de uma busca real (`Alolan Meowth` → 7 cartas encontradas).

---

## 6. Teste do fluxo de anexar carta

Com a chave ativa, testado no navegador o fluxo completo: filtrar Geração VII/Alola → abrir "Alolan Meowth" → buscar → resultados reais da Pokémon TCG API apareceram → clicar em "Alolan Meowth — Cosmic Eclipse" → carta anexada e refletida imediatamente no fichário (arte + nome do set), sem nova chamada à API TCG.

Durante esse teste, foi identificado um pequeno atrito de UX: o campo de busca abria pré-preenchido com o nome da *espécie* ("Meowth") em vez do nome da *forma* ("Alolan Meowth"), obrigando edição manual toda vez que se tratava de uma forma regional. Corrigido em `frontend/src/components/FormDetailPanel.tsx` e documentado em `docs/alteracao_0002.md`.

Dado de teste (a carta anexada ao Alolan Meowth só para validar o fluxo) foi removido antes de encerrar.

---

## 7. Estado atual (fim da sessão inicial)

- Projeto rodando em `docker compose -p app_tcg_pokemon_dev up --build -d`, acessível em `http://localhost:25173`.
- Banco populado com a Pokédex completa (via sync) — coleção do usuário ainda zerada, pronta para ser preenchida.
- Busca/anexo de carta ativo (chave da Pokémon TCG API configurada).
- **Passo manual pendente, esperado**: abrir as 3 formas de clima do Castform (Sunny/Rainy/Snowy) e ativar "Contar esta forma como slot separado" — elas vêm desativadas por padrão pela classificação da PokéAPI.
- Histórico de mudanças de código em `docs/alteracao_0001.md` e `docs/alteracao_0002.md`; próxima mudança deve ser `docs/alteracao_0003.md`.

---

## 8. Da ferramenta de registro ao acervo físico completo

Com o app funcionando e a coleção real sendo preenchida ao longo de várias sessões seguintes, uma segunda onda de pedidos girou em torno de um problema novo: a Living Dex digital precisava espelhar decisões de organização **física** que não têm relação nenhuma com geração/região/número da dex.

- **Página de Gráficos**: primeiro pedido dessa fase — visualizar % de posse em donuts, filtrável por geração/região, com uma grade comparativa (um donut por geração ou por região, dependendo de qual filtro está livre). Implementado em `ChartsPage.tsx`/`DonutChart.tsx` sem dependência nova (SVG puro).
- **Fichários físicos (`binders`)**: pedido central da fase — "eu literalmente monto nos fichários as cartas, mas as formas alternativas Castform por exemplo, deixo 1 no fichário da geração, e os demais em outros fichários". Virou uma tabela `binders` própria + `collection_entries.binder_id`, com CRUD completo (`BinderManagerModal.tsx`), atribuição individual (painel de detalhe) e em lote (seleção múltipla na Lista, reaproveitando o mecanismo que já existia para status).
- **Posição manual dentro do fichário**: o fichário "Alternativas Originais" reúne espécies sem relação de ordem — o usuário queria fixar página + posição (grade 3x3) exatamente como está fisicamente organizado. Adicionado `binder_page`/`binder_slot`, com índice único no banco (duas cartas não podem ocupar o mesmo slot) e a visão "Fichário" passou a respeitar essa posição quando definida, sem quebrar o comportamento padrão nos demais fichários.
- **Formas manuais**: para Pokémon com "diferenças grandes entre os Machos e Femeas" que a PokéAPI não modela como forma própria (só como sprite alternativo) — cadastro manual explícito, herdando geração/região da forma base escolhida (garante a posição certa na ordenação sem lógica extra). Depois de um feedback direto do usuário ("não é prático... crie um botão isolado"), o cadastro foi tirado do modal de cada carta e virou um botão isolado no Toolbar com busca própria.
- **Cadastro manual de carta**: motivado por um caso concreto — Noibat (23/30) existente na Liga Pokémon mas não indexado pela Pokémon TCG API. Como o endpoint de anexar carta já aceitava qualquer objeto (não só resultado de busca), bastou expor um formulário manual na UI. Dois bugs reais apareceram e foram corrigidos durante o uso real: o id gerado estourava o limite da coluna no banco, e depois `crypto.randomUUID()` não existe fora de contexto seguro (HTTPS/localhost) — trocado por um gerador sem dependência da Crypto API.
- **Nome editável por forma**: "deixe eu editar os nome de todos, para deixar mais com a minha cara" — qualquer `display_name` virou editável direto no painel, protegido contra sobrescrita no próximo sync (mesmo padrão de `status_overridden`, agora também para o nome).
- **Filtro por status de posse**: Tenho/Definitiva/Precisa de troca/Não tenho, além do filtro de status da forma que já existia.
- **Curadoria em massa dos fichários especiais**: com a base pronta, o usuário pediu uma série de verificações e movimentações em lote — todas as formas Mega e Gigantamax revisadas (status "Sem necessidade" + fichário próprio, incluindo achar e corrigir duas Megas que faltavam no fichário), e novos fichários "99. Fichário Formas Desnecessárias", "99. Fichário Totem" e "99. Fichário Repetições" criados para reunir variantes cosméticas (roupas do Pikachu, tipos de Arceus/Silvally, tumbas do Furfrou, padrões de Vivillon/Flabébé/Floette/Florges, tamanhos de Pumpkaboo/Gourgeist, doces do Alcremie, formas Totem, repetições de padrão do Scatterbug/Spewpa) — sempre confirmando com o usuário antes de qualquer mudança em massa nos dados reais.

---

## 9. Estado atual

- 25 alterações documentadas em `docs/alteracao_0001.md`–`docs/alteracao_0025.md`; próxima mudança deve ser `docs/alteracao_0026.md`.
- Coleção real do usuário em uso ativo, com dezenas de fichários físicos cadastrados (numerados "01." a "16." por geração/categoria, mais os especiais "99." para Mega/Gigantamax/formas cosméticas/repetições).
- Duas páginas no app: **Fichário** (Grade/Lista/Fichário, com todos os filtros — geração, região, fichário, status da forma, status de posse) e **Gráficos** (donuts agrupáveis por geração, região ou fichário).
