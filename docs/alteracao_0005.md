# Alteração 0005 — Checkbox "Somente elegíveis" virou filtro de 3 estados

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
Substituído o checkbox binário "Somente elegíveis" por um `<select>` "Elegibilidade" na toolbar, com três opções:

- **Elegíveis** (padrão) — mesmo comportamento de antes.
- **Todas** — sem filtro de elegibilidade.
- **Ocultas** — mostra só as formas marcadas como não elegíveis (novo).

Backend: `GET /api/forms` trocou o parâmetro `eligible_only=true|false` por `eligibility=eligible|all|hidden` (`backend/src/routes/forms.ts`). Frontend: `api.forms.list()`, `Toolbar`, `BinderPage` e o tipo `EligibilityFilter` (`frontend/src/types/index.ts`) atualizados de acordo. A lógica de remover/manter um card na lista após um toggle de elegibilidade (seja pelo botão rápido do card, seja pelo painel de detalhe) foi generalizada em `matchesEligibilityFilter()`, cobrindo os três estados.

Testado no navegador: "Elegíveis" (1399 formas), "Todas" (1527) e "Ocultas" (128 — confirma que o botão de ocultar rápido da Alteração 0004 já estava sendo usado ativamente pelo usuário em Mega Evoluções, Gigantamax e os Pikachus de evento).

## Motivação
A opção "Ocultas" não existia antes — não havia como revisar rapidamente tudo que já tinha sido marcado como não elegível, só voltar pra "Todas" (lista enorme) e procurar visualmente os cards apagados.

## Arquivos modificados
- `backend/src/routes/forms.ts`
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/BinderPage.tsx`
