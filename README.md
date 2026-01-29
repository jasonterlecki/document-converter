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

## Feature matrix (best-effort)
| Feature | Markdown | LaTeX | Docx |
| --- | --- | --- | --- |
| Headings | ✅ | ✅ | ✅ |
| Paragraphs / line breaks | ✅ | ✅ | ✅ |
| Bold / Italic | ✅ | ✅ | ✅ |
| Underline | HTML `<u>` | `\\underline{}` | ✅ |
| Lists (unordered) | ✅ | ✅ | ✅ |
| Lists (ordered) | ✅ | ✅ | ✅ |
| Blockquotes | ✅ | ✅ | ✅ |
| Code (inline / block) | ✅ | ✅ | ✅ |
| Links | ✅ | ✅ (`\\href`) | ✅ (as text) |
| Images | ✅ | ✅ (`\\includegraphics`) | ✅ (placeholder text) |
| Tables | ✅ (GFM) | ✅ (basic tabular) | ✅ |

## Tests
```
pnpm -r test
```

## Known limitations
- Conversion fidelity is best-effort; advanced LaTeX and Word features are out of scope.
- No server-side processing; everything runs in the browser.
- Docx links and images are serialized as readable text placeholders (not embedded media).
- LaTeX parsing supports a limited subset (headings, lists, basic tables, inline styles).
- Tables are basic; complex layouts, multi-row headers, and advanced alignment are not supported.
