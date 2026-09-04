# Alteração 0019 — Cadastro de forma manual vira botão isolado, não fica no modal da carta
**Data:** 2026-08-23
**Tipo:** refactor

## O que foi alterado
- `FormDetailPanel.tsx`: removida a seção "Forma manual" inteira (campo de nome + botão Adicionar + badge/Remover), junto com todo o estado e handlers relacionados (`customName`, `creatingCustom`, `customError`, `removingCustom`, `handleCreateCustom`, `handleRemoveCustom`) e as props `onCustomCreated`/`onCustomRemoved`.
- `CustomFormManagerModal.tsx` (novo): modal isolado, mesmo padrão do `BinderManagerModal`. Tem um campo de busca que filtra a lista completa de formas (`GET /api/forms?status=all`) por nome exibido/nome da espécie — ao escolher uma forma base, mostra um segundo campo para o nome da variante e o botão "Adicionar". Abaixo, lista todas as formas manuais já cadastradas (`isCustomForm`), cada uma com botão "Remover".
- `Toolbar.tsx`: novo botão "Formas manuais", ao lado de "Gerenciar fichários", abre o modal.
- `BinderPage.tsx`: estado `managingCustomForms` + `handleCustomFormsChanged` (recarrega a lista de formas depois de qualquer criação/remoção no modal).
- `index.css`: `.binder-list` ganhou `max-height`/`overflow-y: auto` (a lista de formas manuais cadastradas ou de resultados de busca pode crescer bastante); nova classe `.binder-list-item-clickable` para os itens de resultado de busca (cursor e hover).

## Motivação
Usuário apontou que ter o cadastro de forma manual dentro do modal de detalhe de uma carta específica não é prático — obriga abrir a carta "base" certa toda vez. Centralizado num botão isolado com busca própria, resolve isso sem perder a garantia de posição correta na ordem (a forma criada ainda herda espécie/geração/região da forma base escolhida na busca, exatamente como antes — ver `docs/alteracao_0018.md`).

## Arquivos modificados
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/components/CustomFormManagerModal.tsx` (novo)
- `frontend/src/components/Toolbar.tsx`
- `frontend/src/components/BinderPage.tsx`
- `frontend/src/index.css`
