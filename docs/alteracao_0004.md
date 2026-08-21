# Alteração 0004 — Botão de ocultar rápido no card do fichário

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
Adicionado um botão de ocultar/restaurar (✕ / ↺) diretamente em cada card do `BinderGrid`, no canto superior direito (aparece ao passar o mouse; sempre visível quando a forma já está oculta). Um clique chama `PATCH /api/forms/:id/eligibility` diretamente, sem precisar abrir o painel de detalhe completo.

- Com "Somente elegíveis" marcado (padrão): ocultar uma forma a remove da listagem imediatamente.
- Com "Somente elegíveis" desmarcado: a forma oculta continua visível, mas com opacidade reduzida (`.form-card.not-eligible`) e o botão mostra ↺ para restaurar.

Usado para marcar como não elegíveis as formas "de roupinha" do Pikachu (Belle, Pop Star, Ph.D., Libre, Cosplay, bonés de evento, etc.) que o usuário decidiu não considerar como slots separados da Living Dex — um julgamento pessoal que a PokéAPI não classifica de forma automática (a maioria dessas formas não vem marcada como `is_battle_only`, então apareciam elegíveis por padrão).

## Motivação
O toggle de elegibilidade já existia dentro do painel de detalhe (`FormDetailPanel`), mas exigia abrir cada forma individualmente — tedioso para marcar várias formas cosméticas de uma vez (ex: os ~10 Pikachus de evento). O botão direto no card resolve isso com um clique.

## Arquivos modificados
- `frontend/src/components/BinderGrid.tsx`
- `frontend/src/components/BinderPage.tsx`
- `frontend/src/index.css`
