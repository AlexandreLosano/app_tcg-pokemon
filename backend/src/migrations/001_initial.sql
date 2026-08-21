-- Migração 001: Schema inicial — Living Dex

CREATE TABLE generations (
  id           SMALLINT     PRIMARY KEY,
  name         VARCHAR(30)  NOT NULL UNIQUE,
  display_name VARCHAR(30)  NOT NULL
);

CREATE TABLE regions (
  id           INTEGER      PRIMARY KEY,
  name         VARCHAR(30)  NOT NULL UNIQUE,
  display_name VARCHAR(30)  NOT NULL
);

CREATE TABLE species (
  id                  INTEGER      PRIMARY KEY,      -- = national dex number (pokeapi species id)
  name                VARCHAR(50)  NOT NULL UNIQUE,   -- slug, ex: "meowth"
  display_name        VARCHAR(50)  NOT NULL,          -- ex: "Meowth"
  generation_id       SMALLINT     NOT NULL REFERENCES generations(id),  -- geração de origem da espécie (informativo, NÃO usado em filtro)
  is_legendary        BOOLEAN      NOT NULL DEFAULT FALSE,
  is_mythical         BOOLEAN      NOT NULL DEFAULT FALSE,
  sprite_default_url  TEXT,
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE forms (
  id                              SERIAL       PRIMARY KEY,
  pokeapi_form_id                 INTEGER      NOT NULL UNIQUE,   -- pokemon-form.id, chave de idempotência
  pokeapi_pokemon_id              INTEGER      NOT NULL,          -- variety/pokemon.id (auditoria)
  species_id                      INTEGER      NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  form_slug                       VARCHAR(60)  NOT NULL,          -- ex: "meowth-alola", "castform-sunny"
  display_name                    VARCHAR(80)  NOT NULL,          -- ex: "Alolan Meowth", "Sunny Castform"
  form_name                       VARCHAR(60)  NOT NULL DEFAULT '', -- raw form_name, ex: "alola", ""
  is_default_variety              BOOLEAN      NOT NULL DEFAULT FALSE, -- variedade canônica da espécie
  is_battle_only                  BOOLEAN      NOT NULL DEFAULT FALSE,
  is_mega                         BOOLEAN      NOT NULL DEFAULT FALSE,
  is_gmax                         BOOLEAN      NOT NULL DEFAULT FALSE,
  generation_id                   SMALLINT     REFERENCES generations(id), -- NULL se version_group ausente (defensivo)
  region_id                       INTEGER      REFERENCES regions(id),
  version_group                   VARCHAR(60),                    -- slug bruto, ex: "ruby-sapphire" (auditoria)
  sprite_url                      TEXT,
  living_dex_eligible             BOOLEAN      NOT NULL DEFAULT TRUE,
  living_dex_eligible_overridden  BOOLEAN      NOT NULL DEFAULT FALSE, -- true após toggle manual do usuário
  created_at                      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (species_id, form_slug)
);

CREATE INDEX idx_forms_species    ON forms(species_id);
CREATE INDEX idx_forms_generation ON forms(generation_id);
CREATE INDEX idx_forms_region     ON forms(region_id);
CREATE INDEX idx_forms_eligible   ON forms(living_dex_eligible);

CREATE TABLE tcg_cards (
  id                          VARCHAR(30)  PRIMARY KEY,   -- id da carta na Pokémon TCG API, ex: "swsh1-1"
  name                        VARCHAR(100) NOT NULL,
  supertype                   VARCHAR(30),
  subtypes                    TEXT[],
  hp                          VARCHAR(10),
  types                       TEXT[],
  set_id                      VARCHAR(30),
  set_name                    VARCHAR(100),
  set_series                  VARCHAR(100),
  set_release_date            VARCHAR(20),   -- formato original da API, ex: "1999/01/09"
  card_number                 VARCHAR(10),
  rarity                      VARCHAR(40),
  artist                      VARCHAR(100),
  image_small_url             TEXT         NOT NULL,
  image_large_url             TEXT,
  national_pokedex_numbers    INTEGER[],
  raw_json                    JSONB,        -- resposta completa da API, para uso futuro
  cached_at                   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE collection_entries (
  form_id        INTEGER      PRIMARY KEY REFERENCES forms(id) ON DELETE CASCADE,
  owned          BOOLEAN      NOT NULL DEFAULT FALSE,
  is_definitive  BOOLEAN      NOT NULL DEFAULT FALSE,
  needs_trade    BOOLEAN      NOT NULL DEFAULT FALSE,
  notes          TEXT,
  tcg_card_id    VARCHAR(30)  REFERENCES tcg_cards(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT chk_definitive_requires_owned CHECK (NOT is_definitive OR owned),
  CONSTRAINT chk_needs_trade_requires_owned CHECK (NOT needs_trade OR owned),
  CONSTRAINT chk_not_definitive_and_trade CHECK (NOT (is_definitive AND needs_trade))
);
