# Alteração 0010 — Seleção em lote na Lista + slot "Unown (Geral)"

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado

### Seleção em lote na Lista
`frontend/src/components/ListView.tsx` ganhou uma checkbox por linha (mais "selecionar todos" no cabeçalho). Ao selecionar uma ou mais linhas, aparece uma barra de ação ("N selecionada(s) · Marcar como: Visível / Sem necessidade / Sem carta ainda / Oculta / Limpar seleção") que aplica o status escolhido a todas de uma vez.

- `BinderPage.tsx`: novo `handleBulkSetStatus(formIds, status)` — dispara os `PATCH /api/forms/:id/status` em paralelo (`Promise.all`) e depois atualiza/filtra a lista local de uma vez.
- A seleção é limpa automaticamente quando um novo carregamento começa (troca de filtro), mas **não** quando uma edição pontual (ex: pelo painel de detalhe) só atualiza a lista em memória — evita perder a seleção sem querer.

Testado no navegador: selecionadas 5 formas Mega (Venusaur/Charizard Y/Blastoise/Beedrill/Pidgeot) que estavam `hidden`, aplicado "Sem necessidade" em lote — confirmado no banco e na UI. "Selecionar todos" testado com 186 linhas de uma vez.

### Slot "Unown (Geral)"
Pedido do usuário para o Unown especificamente: manter as 28 formas-letra (A–Z, !, ?) todas visíveis **e** adicionar mais 1 slot "geral" representando a espécie como um todo, na posição correta da Geração II — não substituir as 28 por 1 (isso foi uma primeira tentativa errada, revertida antes de prosseguir).

Como o schema não tem um conceito de "slot sem forma real da PokéAPI", foi inserida uma linha sintética na tabela `forms`:

```sql
INSERT INTO forms (
  pokeapi_form_id, pokeapi_pokemon_id, species_id, form_slug, display_name, form_name,
  is_default_variety, is_battle_only, is_mega, is_gmax, generation_id, region_id, version_group,
  sprite_url, status, status_overridden
) VALUES (
  -201, -201, 201, 'unown-general', 'Unown (Geral)', 'general',
  false, false, false, false, 2, 2, NULL,
  '<url do artwork oficial do Unown>', 'visible', true
);
```

`pokeapi_form_id = -201` (negativo, baseado no id da espécie) garante que nunca colida com um id real da PokéAPI (sempre positivos) — o sync nunca vai encontrar esse id no payload da API, então nunca mexe nessa linha via `ON CONFLICT`. `generation_id`/`region_id` = Geração II/Johto (mesma da espécie), então a ordenação `ORDER BY sp.id, f.id` já posiciona o slot corretamente junto das outras 28 formas do Unown. Também foi inserida a `collection_entries` correspondente.

Resultado: 29 slots de Unown na Living Dex (26 letras + ! + ? + Geral), todos visíveis, confirmado no navegador na ordem certa (logo após "Unown Z", antes de "Wobbuffet").

**Padrão registrado para reuso futuro** (não virou migração — é uma decisão de dados pessoal do usuário, igual às marcações de status manuais, não faz parte do schema genérico do app): se precisar de outro "slot geral" sintético para outra espécie com formas fragmentadas, seguir o mesmo padrão (`pokeapi_form_id` negativo = `-species_id`, ou outro esquema negativo determinístico se houver mais de um por espécie).

## Motivação
Usuário quer rastrear tanto "tenho algum Unown" (slot geral) quanto, eventualmente, cada letra individualmente — sem perder o controle fino já existente nas 28 formas.

## Arquivos modificados
- `frontend/src/components/ListView.tsx`, `BinderPage.tsx`
- `frontend/src/index.css`
- Dado (não-migração): 1 linha sintética em `forms` + `collection_entries` para `unown-general`.
