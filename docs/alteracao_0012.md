# Alteração 0012 — Página de gráficos donut (posse por geração/região)
**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
- Nova página "Gráficos", acessível por um nav no topo do app (`App.tsx`), ao lado do "Fichário" existente.
- `ChartsPage.tsx`: filtros de Geração e Região (mesmo padrão do `Toolbar`), buscando formas via `GET /api/forms` sem informar `status` — o backend já aplica o padrão `status=visible`, então formas ocultas (e as marcadas `no_need`/`card_unavailable`, que também não contam como slot ativo) ficam fora da contagem automaticamente.
- Donut principal com a repartição em 4 categorias (Definitiva/Precisa de troca/Tenho/Não tenho), reaproveitando a mesma paleta de `statusClass`/`statusLabel` (`utils/formDisplay.ts`) já usada na grade, lista e fichário.
- Grade comparativa de donuts menores (tenho vs não tenho) agrupada pelo eixo que não foi fixado no filtro: se nenhum filtro específico está selecionado ou só a região está fixada, agrupa por geração; se só a geração está fixada, agrupa por região. Com os dois filtros fixados, a grade some (não há eixo livre para comparar).
- `DonutChart.tsx`: componente SVG puro reutilizável (sem nova dependência), com legenda opcional e texto central configurável.
- `Toolbar.tsx`: removido o `<h1>` duplicado (título agora vive só no nav de topo em `App.tsx`).
- `index.css`: `.app-root`/`.app-nav` para o novo nav de topo (o antigo `.app` deixou de fixar `height: 100%` e passou a `flex: 1; min-height: 0`, já que agora é filho do `.app-root`); estilos de `.charts-page`, `.chart-section`, `.donut-chart`, `.donut-legend` e `.donut-grid`.

## Motivação
Usuário pediu uma página com gráficos donut para escolher uma região ou geração e ver a quantidade de cartas que possui, com a regra explícita de que formas ocultas não entram na contagem geral. Reaproveitar o filtro padrão `status=visible` do endpoint `/api/forms` (em vez de inventar um filtro novo) já cobre essa regra e mantém a página consistente com o conceito de "slot ativo" descrito no `CLAUDE.md`.

## Arquivos modificados
- `frontend/src/App.tsx`
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/ChartsPage.tsx` (novo)
- `frontend/src/components/DonutChart.tsx` (novo)
- `frontend/src/index.css`
