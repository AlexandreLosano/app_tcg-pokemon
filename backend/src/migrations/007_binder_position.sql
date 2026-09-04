-- Migração 007: posição manual (página + slot) dentro de um fichário
--
-- Alguns fichários físicos não seguem a ordem natural da dex (ex: "Alternativas Originais",
-- que reúne formas de espécies bem diferentes). binder_page/binder_slot deixam o usuário fixar
-- exatamente em qual página e em qual dos 9 slots (contagem 1-9, grade 3x3) uma carta fica
-- na visão "Fichário" -- só fazem sentido quando a forma já está associada a um binder_id, mas
-- não são exigidos: sem eles, a visão volta ao comportamento padrão (ordem da dex, paginação
-- sequencial de 9 em 9).

ALTER TABLE collection_entries ADD COLUMN binder_page SMALLINT;
ALTER TABLE collection_entries ADD COLUMN binder_slot SMALLINT;

ALTER TABLE collection_entries ADD CONSTRAINT chk_binder_slot_range
  CHECK (binder_slot IS NULL OR (binder_slot BETWEEN 1 AND 9));
ALTER TABLE collection_entries ADD CONSTRAINT chk_binder_page_positive
  CHECK (binder_page IS NULL OR binder_page >= 1);

-- Duas formas não podem ocupar a mesma página+slot no mesmo fichário.
CREATE UNIQUE INDEX idx_collection_entries_binder_position
  ON collection_entries (binder_id, binder_page, binder_slot)
  WHERE binder_id IS NOT NULL AND binder_page IS NOT NULL AND binder_slot IS NOT NULL;
