# Alteração 0002 — Configuração da chave da Pokémon TCG API e ajuste na busca de cartas

**Data:** 2026-08-21
**Tipo:** fix

## O que foi alterado
- Usuário gerou uma chave gratuita em dev.pokemontcg.io e configurou `POKEMON_TCG_API_KEY` no `.env`. Backend reiniciado para carregar a variável — busca de cartas confirmada ativa (`GET /api/tcg-cards/status` → `configured: true`).
- Testado o fluxo completo no navegador: filtro Geração VII/Alola → abrir "Alolan Meowth" → buscar → anexar carta real ("Alolan Meowth", Cosmic Eclipse, #128) → confirmado que a arte aparece no fichário sem nova chamada à API.
- Corrigido `frontend/src/components/FormDetailPanel.tsx`: o campo de busca de carta agora abre pré-preenchido com `form.display_name` (ex: "Alolan Meowth") em vez de `form.species_display_name` (ex: "Meowth"), trazendo resultados mais precisos por padrão para formas regionais/variantes.

## Motivação
Ao testar o anexo de carta, o campo de busca vinha pré-preenchido só com o nome da espécie base, obrigando o usuário a editar manualmente para formas regionais (Alolan/Galarian) toda vez — um atrito desnecessário já que o nome da forma já é conhecido.

## Arquivos modificados
- `frontend/src/components/FormDetailPanel.tsx`
