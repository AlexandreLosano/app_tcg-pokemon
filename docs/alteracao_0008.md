# Alteração 0008 — Fichário: arte maior com detalhes ao lado

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
Redesenhado o slot de cada card na visão de Fichário (`frontend/src/components/AlbumView.tsx`): antes era o mesmo layout vertical/centralizado da Grade (imagem pequena em cima, texto embaixo), desperdiçando o espaço maior de cada quadro 3x3. Agora cada slot usa layout horizontal — a arte ocupa a altura toda do quadro à esquerda (bem maior, a carta fica legível), e os detalhes (nome, geração/região, set + número da carta anexada, status "Definitiva"/"Precisa de troca"/"Tenho"/"Não tenho") ficam ao lado, à direita.

Quando não há carta anexada nem sprite disponível, aparece um placeholder "sem arte" no lugar da imagem (antes era uma div vazia sem texto).

Testado no navegador: cards com carta anexada (arte real da TCG, ex: Bulbasaur — Pokémon GO #1), cards só com sprite da PokéAPI (ex: Alolan Raichu), e a última página de um filtro pequeno (Geração I, 7 itens + 2 slots vazios) — todos renderizando corretamente.

## Motivação
Pedido do usuário: aproveitar melhor o espaço de cada quadro do fichário, com a arte maior e os detalhes organizados ao lado, em vez do layout compacto e centralizado herdado da Grade.

## Arquivos modificados
- `frontend/src/components/AlbumView.tsx`
- `frontend/src/index.css`
