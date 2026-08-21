-- Migração 002: status de forma com mais categorias além de visível/oculta
--
-- living_dex_eligible (boolean) vira status (texto), com 4 valores:
--   'visible'          -- conta como slot ativo da Living Dex (padrão)
--   'hidden'           -- não conta como slot (ex: Pikachus de roupinha) -- era living_dex_eligible=false
--   'no_need'          -- existe carta, mas não é prioridade comprar agora (ex: formas Mega)
--   'card_unavailable' -- forma que eu quero, mas ainda não tem carta impressa (ex: Squawkabilly Blue Plumage)
--
-- living_dex_eligible_overridden vira status_overridden, com o mesmo papel: trava o valor
-- contra o próximo sync depois que o usuário escolhe manualmente.

ALTER TABLE forms ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'visible';
ALTER TABLE forms ADD CONSTRAINT chk_forms_status
  CHECK (status IN ('visible', 'hidden', 'no_need', 'card_unavailable'));

UPDATE forms SET status = 'hidden' WHERE living_dex_eligible = false;

ALTER TABLE forms RENAME COLUMN living_dex_eligible_overridden TO status_overridden;
ALTER TABLE forms DROP COLUMN living_dex_eligible;

CREATE INDEX idx_forms_status ON forms(status);
