# Alteração 0025 — Gráficos: agrupamento por Fichário
**Data:** 2026-08-24
**Tipo:** feat

## O que foi alterado
- `frontend/src/components/ChartsPage.tsx`:
  - Novo filtro "Fichário" (mesmo padrão de `Toolbar.tsx`, incluindo a opção "Sem fichário"), ao lado de Geração/Região.
  - A antiga lógica implícita de "agrupa pelo eixo que não está fixado" foi substituída por um seletor explícito "Agrupar por" (Geração/Região/Fichário) — mais direto e permite agrupar por fichário mesmo com geração/região livres.
  - `groupBy()` ganhou o eixo `'binder'` (`form.binder_id`/`form.binder_name`, com "Sem fichário" para formas sem um).

## Motivação
Usuário quer ver a grade comparativa de donuts por fichário físico, não só por geração/região.

Testado no navegador: com "Agrupar por" = Fichário, a grade mostra um donut por fichário cadastrado, cada um com o % de posse. Fichários com formas `no_need`/`hidden` (Megas, Gigas, Formas Desnecessárias, Totem, Repetições) corretamente não aparecem, porque a página já buscava as formas sem passar `status` — o backend aplica o padrão `visible`, consistente com o resto do app (não é regressão, é o comportamento já documentado na Alteração 0012).

## Arquivos modificados
- `frontend/src/components/ChartsPage.tsx`
