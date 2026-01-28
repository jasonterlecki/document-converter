# DocMorph Web

DocMorph Web is a browser-only document converter that supports Markdown, LaTeX, and Word (.docx) using a shared intermediate representation (IR).

## Status
Scaffolded monorepo with `core` and `web` packages. Converters and UI are in progress.

## Scripts
- `pnpm install`
- `pnpm -r build`
- `pnpm -r test`
- `pnpm --filter web dev`

## Known limitations
- Conversion fidelity is best-effort; advanced LaTeX and Word features are out of scope.
- No server-side processing.
