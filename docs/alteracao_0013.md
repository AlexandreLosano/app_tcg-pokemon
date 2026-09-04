# Alteração 0013 — Status na Living Dex vira combo com botão Salvar
**Data:** 2026-08-21
**Tipo:** fix

## O que foi alterado
- `FormDetailPanel.tsx`: o seletor "Status na Living Dex" deixou de ser um grupo de radio buttons que aplicava a mudança imediatamente ao clicar. Agora é um `<select>` (combo) com a descrição da opção selecionada logo abaixo, e um botão "Salvar" explícito que só chama `PATCH /api/forms/:id/status` quando clicado.
- Estado `statusDraft` guarda a escolha ainda não salva; é resetado para `form.status` sempre que o painel troca de forma ou quando `form.status` muda (ex: depois de salvar). O botão "Salvar" fica desabilitado enquanto não há mudança pendente ou durante o salvamento.
- `index.css`: `.status-options`/`.status-option*` (cards de radio) substituídos por `.status-select`, `.status-select-desc` e `.status-save-row`.

## Motivação
Usuário reportou desconforto com o comportamento anterior: qualquer clique numa opção já persistia no servidor sem confirmação, e fechar o painel (clicando fora ou no ×) não dava chance de revisar a escolha antes de salvar.

## Arquivos modificados
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/index.css`
