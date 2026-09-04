# Alteração 0014 — Botão "Salvar" do status também fecha o modal
**Data:** 2026-08-21
**Tipo:** fix

## O que foi alterado
- `FormDetailPanel.tsx`: `handleSaveStatus` agora chama `onClose()` depois de salvar (ou imediatamente, se `statusDraft` não mudou em relação a `form.status` — nesse caso nem chama a API, só fecha). O botão deixou de ficar desabilitado quando não há mudança pendente; agora só desabilita durante o salvamento (`savingStatus`).
- Rótulo do botão trocado de "Salvar" para "Salvar e fechar", deixando explícito que ele também fecha o painel.

## Motivação
Depois da Alteração 0013, o usuário reportou que "não estava funcionando" — na prática, o combo e o salvamento em si já persistiam corretamente (verificado direto no banco, inclusive testando com o Hoothoot, forma sem cadastro), mas o botão não fechava o modal. A intenção original era ter uma forma confiável de confirmar e sair do painel sem depender de clicar fora ou no ×; faltava justamente o fechamento automático.

## Arquivos modificados
- `frontend/src/components/FormDetailPanel.tsx`
