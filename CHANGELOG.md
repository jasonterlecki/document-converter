# Changelog

## 2026-01-28
- Bootstrapped pnpm monorepo structure with core and web package scaffolding.
- Added base TypeScript, ESLint, and Prettier configuration.
- Added placeholder React app entry for the web package.
- Added initial README and CODEX documentation.
- Implemented IR type model, validators, and normalization pass in core.
- Added IR normalization tests.
- Updated pnpm packageManager version to 10.28.2.
- Added Markdown parser/serializer with fixtures and unit tests in core.
- Added LaTeX parser/serializer subset with fixtures and unit tests in core.
- Added Docx parse/serialize scaffolding with fixtures and unit tests in core.
- Added round-trip shape tests for Markdown, LaTeX, and Docx.
- Added a web conversion worker pipeline with basic UI wiring.
