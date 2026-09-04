-- Migração 006: alarga tcg_cards.id/collection_entries.tcg_card_id
--
-- Ids reais da Pokémon TCG API cabem tranquilamente em VARCHAR(30) (ex: "swsh12tg-TG18"),
-- mas o id gerado para carta cadastrada manualmente ("manual-" + UUID) tem 43 caracteres e
-- estourava o limite, quebrando o attach com "value too long for type character varying(30)".

ALTER TABLE tcg_cards ALTER COLUMN id TYPE VARCHAR(64);
ALTER TABLE collection_entries ALTER COLUMN tcg_card_id TYPE VARCHAR(64);
