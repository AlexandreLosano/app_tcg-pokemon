-- Migração 004: sequência para ids negativos de formas cadastradas manualmente
--
-- Complementa o padrão já usado no slot "Unown (Geral)" (pokeapi_form_id = -species_id,
-- registrado manualmente via SQL, ver docs/alteracao_0010.md). Agora que cadastrar uma forma
-- manual vira uma função do próprio app (POST /api/forms/custom — ex: diferença grande entre
-- macho e fêmea que o sync não separa em forms distintas), precisamos de uma fonte de ids
-- negativos únicos que não dependa da espécie (uma espécie pode ganhar mais de uma forma
-- manual) e que nunca colida com o -201 já em uso. O offset de -1.000.000 garante isso com
-- folga (species_id real da PokéAPI nunca chega perto disso).

CREATE SEQUENCE custom_form_seq START 1;
