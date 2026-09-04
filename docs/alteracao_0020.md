# Alteração 0020 — Renomear qualquer forma (nome persiste contra o sync)
**Data:** 2026-08-23
**Tipo:** feat

## O que foi alterado
- `backend/src/migrations/005_display_name_override.sql`: nova coluna `forms.display_name_overridden` (mesmo padrão de `status_overridden`).
- `backend/src/services/pokeSync.ts`: o UPSERT de `forms` agora só sobrescreve `display_name` quando `display_name_overridden` é falso (`CASE WHEN forms.display_name_overridden THEN forms.display_name ELSE EXCLUDED.display_name END`) — sem isso, o próximo "Atualizar" (sync) apagaria qualquer nome escolhido pelo usuário.
- `backend/src/routes/forms.ts`: `SELECT_FORM_SQL` retorna `f.display_name_overridden`; nova rota `PATCH /api/forms/:id/display-name` (`{ display_name }`), seta o nome e trava o override.
- Frontend:
  - `types/index.ts`: `FormEntry.display_name_overridden`.
  - `api/client.ts`: `forms.setDisplayName(formId, displayName)`.
  - `FormDetailPanel.tsx`: o título (antes um `<h2>` estático) virou um campo de texto editável — salva ao perder o foco (mesmo padrão já usado em Notas), com Enter forçando o blur. Mostra o badge "nome editado" quando `display_name_overridden` é true.
  - `index.css`: `.form-title-row`/`.form-title-input`, estilizado para parecer o título original até ganhar foco.

## Motivação
Usuário quer personalizar os nomes exibidos de todas as formas da Living Dex ("deixar mais com a minha cara"). Testado o ciclo completo: renomear, confirmar que persiste na UI/lista/grade sem reload, rodar o sync (`POST /api/sync/pokemon`) e confirmar que o nome customizado sobrevive.

## Arquivos modificados
- `backend/src/migrations/005_display_name_override.sql` (novo)
- `backend/src/services/pokeSync.ts`
- `backend/src/routes/forms.ts`
- `frontend/src/types/index.ts`
- `frontend/src/api/client.ts`
- `frontend/src/components/FormDetailPanel.tsx`
- `frontend/src/index.css`
