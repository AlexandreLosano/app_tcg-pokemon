# Alteração 0001 — Criação do projeto Living Dex TCG Pokémon

**Data:** 2026-08-21
**Tipo:** feat

## O que foi alterado
Criação completa do projeto `app_tcg-pokemon`: backend (Node+TypeScript+Express+PostgreSQL), frontend (React+Vite+TypeScript), Docker Compose, e integração com duas APIs gratuitas:

- **PokéAPI** (GraphQL beta) para sincronizar espécies, formas, gerações e regiões.
- **Pokémon TCG API** para buscar e anexar cartas físicas às formas da coleção.

Modelo de dados central: geração e região vivem na tabela `forms` (por forma), não em `species` — isso permite que Meowth apareça como 1 slot em Geração I (Kanto), 1 em Geração VII (Alola) e 1 em Geração VIII (Galar), enquanto as 4 formas de Castform (Normal/Sunny/Rainy/Snowy) aparecem juntas em Geração III/Hoenn.

Funcionalidades implementadas:
- Filtro por Geração e Região no nível da forma.
- Botão "Atualizar" que roda um sync idempotente contra a PokéAPI (síncrono, ~1.5s).
- Toggle de elegibilidade por forma (`living_dex_eligible`), com override manual preservado entre syncs — necessário porque a PokéAPI marca formas cosméticas/batalha-apenas (como as de clima do Castform) como não elegíveis por padrão.
- Coleção por forma: tenho a carta / carta definitiva / precisa de troca / notas, com normalização das três flags no servidor.
- Busca e anexo de carta física da Pokémon TCG API (com fallback gracioso quando `POKEMON_TCG_API_KEY` não está configurada).
- Fichário visual (grid) com cor de borda indicando status (definitiva/precisa trocar/tenho/não tenho).

## Motivação
Usuário possui uma coleção física de cartas TCG organizada como Living Dex e precisava de uma ferramenta para rastrear quais formas de cada Pokémon já possui, considerando que algumas formas pertencem a gerações/regiões diferentes (Meowth) e outras à mesma geração/região (Castform).

## Arquivos modificados
Todo o projeto (criação inicial) — ver `README.md` para a estrutura completa.
