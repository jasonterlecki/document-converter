# DocMorph Web

DocMorph Web is a browser-only document converter that supports Markdown, LaTeX, and Word (.docx) using a shared intermediate representation (IR).

## Status
Core converters and a web UI are available; the app runs entirely in the browser.

## Quick start
1) Install dependencies
```
pnpm install
```

2) Start the web app
```
pnpm --filter @docmorph/web dev
```

3) Open the printed local URL in your browser.

## Tests
```
pnpm -r test
```

## Known limitations
- Conversion fidelity is best-effort; advanced LaTeX and Word features are out of scope.
- No server-side processing.
