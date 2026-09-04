# Alteração 0015 — Busca de carta em uma linha só e botão salvar no rodapé do modal
**Data:** 2026-08-21
**Tipo:** fix

## O que foi alterado
- `FormDetailPanel.tsx`: os 4 elementos da busca de carta (nome, número, raridade e o botão "Buscar") agora ficam numa única linha (`.search-box` com `flex-wrap: nowrap`). O select de raridade, antes numa linha própria (`.search-filter-row`, com `<label>Raridade</label>` ao lado), passou a viver dentro do mesmo `.search-box`, usando a própria opção padrão ("Raridade") como rótulo.
- Botão "Buscar" trocou a classe `btn-small` (cinza, igual aos outros botões secundários) pela nova `.search-button`, com fundo `var(--accent)` — mesma cor do "Salvar e fechar" — para se destacar como a ação principal da linha.
- O botão "Salvar e fechar" (da seção "Status na Living Dex") foi movido para fora dessa seção e virou o último elemento do modal, dentro de um novo `.modal-footer` (com borda superior separando do conteúdo), depois da seção "Carta anexada".
- `index.css`: `.search-box`/`.search-box input`/`.search-number-input` reescritos para caber tudo numa linha; `.search-filter-row` removido (não é mais usado); `.search-button` novo; `.status-save-row` trocado por `.modal-footer`.

## Motivação
Ajuste visual pedido pelo usuário: reduzir a busca de carta a uma linha compacta com o botão de ação em destaque, e manter o botão de salvar sempre como a última coisa do painel, reforçando que ele é o passo final antes de fechar.

## Arquivos modificados
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/index.css`
