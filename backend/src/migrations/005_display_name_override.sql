-- Migração 005: nome de exibição editável pelo usuário
--
-- O sync sobrescreve forms.display_name a cada "Atualizar" (vem direto da PokéAPI). Para o
-- usuário poder renomear uma forma do jeito que preferir e o sync não apagar essa escolha,
-- seguimos o mesmo padrão já usado em status_overridden: um flag que trava o valor contra o
-- próximo UPSERT do sync depois que o usuário edita manualmente.

ALTER TABLE forms ADD COLUMN display_name_overridden BOOLEAN NOT NULL DEFAULT FALSE;
