# Alteração 0022 — Cadastro manual de carta quando a busca na API não encontra
**Data:** 2026-08-23
**Tipo:** feat

## O que foi alterado
- `FormDetailPanel.tsx`: na seção "Carta anexada", quando a busca não encontra a carta, um botão "Carta não está na API — cadastrar manualmente" abre um formulário (nome, número, coleção/set, raridade, URL da imagem) que anexa a carta via o mesmo endpoint já existente (`POST /api/collection/:formId/attach-card`, que já aceitava qualquer objeto de carta, não só resultado de busca — nenhuma mudança de backend precisou ser feita nesse endpoint). O `id` da carta manual é gerado como `manual-${crypto.randomUUID()}`; a carta anexada mostra o badge "cadastrada manualmente" quando `tcg_card_id` começa com `manual-`.
- `backend/src/migrations/006_widen_tcg_card_id.sql`: **bug encontrado durante o teste** — `tcg_cards.id`/`collection_entries.tcg_card_id` eram `VARCHAR(30)`, e o id manual (`manual-` + UUID = 43 caracteres) estourava esse limite, quebrando o attach com `value too long for type character varying(30)`. Alargado para `VARCHAR(64)`.
- **Segundo bug, reportado pelo usuário em seguida**: `crypto.randomUUID()` exige contexto seguro (HTTPS ou `localhost`) — acessando o app por IP na rede local (não "localhost" literal), o método nem existe, e o clique em "Anexar" falhava com `crypto.randomUUID is not a function`. Trocado por `generateManualCardId()` (`Date.now().toString(36)` + sufixo aleatório via `Math.random()`), sem depender da Crypto API.

## Motivação
Usuário reportou não achar uma carta de Noibat (23/30) pela busca — a Pokémon TCG API não tem todos os prints indexados (ex: sets regionais/promocionais). Antes disso não havia como registrar uma carta que existe fisicamente mas não está na API.

## Arquivos modificados
- `backend/src/migrations/006_widen_tcg_card_id.sql` (novo)
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/index.css`
