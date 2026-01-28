# CODEX

## Purpose
DocMorph Web is a browser-only document converter for Markdown, LaTeX, and Word (.docx). It uses a shared intermediate representation (IR) to keep conversions deterministic and testable.

## Repository map
- `packages/core`: IR types, parsers, serializers, and unit tests.
- `packages/web`: React + Vite UI, workers, and web adapters.
- `tsconfig.base.json`: shared TypeScript settings.
- `.eslintrc.cjs`, `.prettierrc.cjs`: lint/format defaults.

## Key entry points
- `packages/core/src/index.ts`: public exports for the core library.
- `packages/core/src/ir/index.ts`: IR types, validators, and normalization.
- `packages/core/src/markdown/index.ts`: Markdown parse/serialize entry.
- `packages/web/src/main.tsx`: web app entry.
- `packages/web/src/app/App.tsx`: initial UI shell.

## Data model
- IR models documents as blocks and inlines in `packages/core/src/ir/types.ts`.
- Validation helpers live in `packages/core/src/ir/validators.ts`.
- Normalization (merge adjacent text nodes) lives in `packages/core/src/ir/normalize.ts`.
- IR versioning is tracked via `IR_VERSION` in `packages/core/src/ir/version.ts`.

## Converters
- Markdown converters live in `packages/core/src/markdown/parse.ts` and `packages/core/src/markdown/serialize.ts`.
- Fixtures for Markdown tests are under `packages/core/test/fixtures/markdown/`.

## Workflows and conventions
- Use pnpm workspaces (see root packageManager version).
- Keep conversions browser-compatible; no server dependencies.
- Update `CHANGELOG.md` and `CODEX.md` on every change.
- Commit after each change; do not push.

## Constraints and non-goals
- Best-effort conversion; no LaTeX macro expansion or advanced Word features.
- No PDF support.
