# Alteração 0011 — Checkbox "Sem cadastro" para isolar o que falta trabalhar

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
Novo checkbox "Sem cadastro" na toolbar, ao lado do filtro de Status. Quando marcado, filtra a lista (nas três views — Grade, Lista, Fichário) para mostrar só as formas que o usuário ainda não tocou: não marcadas como "tenho a carta", sem nota escrita, sem carta anexada (`frontend/src/utils/formDisplay.ts` → `hasNoRegistration()`).

Filtro aplicado no cliente, em `BinderPage.tsx` (`visibleForms = onlyBlank ? forms.filter(hasNoRegistration) : forms`), sobre os dados já carregados — sem endpoint novo. O `AlbumView` volta para a página 1 quando o checkbox é alternado (adicionado ao `key` que já reseta a paginação em trocas de filtro).

Testado no navegador: com Status "Visíveis" (1315 formas), marcar "Sem cadastro" reduziu para 1278 — as 37 restantes já tinham algum dado (posse, nota ou carta) e ficaram de fora. Mesma contagem (1278) confirmada nas três views.

## Motivação
Usuário quer conseguir separar rapidamente o que já foi cadastrado (mesmo que só parcialmente — uma nota, uma carta anexada como wishlist) do que ainda está completamente em branco, para saber por onde continuar.

## Arquivos modificados
- `frontend/src/utils/formDisplay.ts`
- `frontend/src/components/Toolbar.tsx`, `BinderPage.tsx`
