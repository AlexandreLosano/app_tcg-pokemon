# Alteração 0021 — Fichário editável antes de marcar "Tenho a carta"
**Data:** 2026-08-23
**Tipo:** fix

## O que foi alterado
- `FormDetailPanel.tsx`: o campo "Fichário onde está guardada" deixou de ficar `disabled={!form.owned}` e foi movido para o topo da seção "Coleção", antes do checkbox "Tenho a carta" (antes vinha depois das três checkboxes).

## Motivação
Usuário quer poder decidir/registrar em qual fichário físico uma carta vai ficar antes (ou independente) de marcar se já a possui — a ordem dos campos anteriores forçava marcar "Tenho a carta" primeiro para o fichário ficar editável, o que não bate com o fluxo real de uso.

## Arquivos modificados
- `frontend/src/components/FormDetailPanel.tsx`
