-- Migração 003: cadastro de fichários físicos
--
-- O usuário guarda as cartas fisicamente espalhadas em vários fichários reais -- ex: Castform
-- tem 4 formas na mesma geração, mas só uma fica no fichário "principal" daquela geração, as
-- outras 3 vão para outros fichários. binder_id registra em qual fichário físico a carta da
-- forma está guardada. Não exigimos owned=true via CHECK (fica a critério da UI), porque não
-- há problema em registrar o fichário antes de marcar a carta como possuída.

CREATE TABLE binders (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(60)  NOT NULL UNIQUE,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE collection_entries
  ADD COLUMN binder_id INTEGER REFERENCES binders(id) ON DELETE SET NULL;

CREATE INDEX idx_collection_entries_binder ON collection_entries(binder_id);
