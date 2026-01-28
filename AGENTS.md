# AGENTS.md

## Project
DocMorph Web.  A NodeJS (TypeScript) project that runs as a pure web application to convert documents between:
- Markdown
- LaTeX
- Word (.docx)

Conversion is best-effort with a focus on preserving common structure and styling:
- Bold, italic, underline
- Headings (levels 1-6)
- Paragraphs and line breaks
- Ordered and unordered lists (including nested hierarchies)
- Blockquotes
- Code (inline and blocks)
- Links and images (when possible)
- Tables (basic grid, header row, alignment where possible)

Primary requirement: runs in the browser.  No server-side conversion dependency.  Node tooling is allowed for build/test only.

## Success criteria
1. A user can load a file (or paste text) and convert between any pair of formats.
2. Output is downloadable and human-editable.
3. A shared intermediate representation (IR) is used, so conversions are consistent and testable.
4. Unit tests cover the IR and each converter with fixtures for typical and edge cases.
5. The web UI is fast enough for normal documents (a few hundred KB) and does not freeze the page (use workers).

## Non-goals
- Perfect round-trip fidelity for every possible Word or LaTeX construct.
- Full LaTeX package support or TeX macro execution.
- Converting embedded Word drawings, tracked changes, comments, footnotes/endnotes, or complex layout.
- PDF support.

## Approach
Use a normalized IR as the hub:
`Markdown <-> IR <-> LaTeX`
`Word <-> IR`

Do not convert format-to-format directly except through IR.  This keeps behavior predictable and reduces combinatorial complexity.

### Intermediate representation (IR)
Implement a small, explicit document model that captures structure and inline formatting.  Keep it stable and versioned.

Recommended IR nodes:
- Document { blocks[] }
- Paragraph { inlines[] }
- Heading { level, inlines[] }
- List { ordered, items[] }
  - ListItem { blocks[] } (supports nested lists by containing blocks)
- Blockquote { blocks[] }
- CodeBlock { language?, text }
- HorizontalRule
- Table { headerRow?, rows[], alignments? }
  - TableRow { cells[] }
  - TableCell { blocks[] } (or inlines[] for v1)
- Image { alt?, src }
- Link { href, inlines[] }

Inline nodes:
- Text { text }
- Strong { inlines[] }
- Emphasis { inlines[] }
- Underline { inlines[] }
- CodeSpan { text }
- LineBreak

IR rules:
- Preserve ordering.
- Avoid storing format-specific artifacts.
- Maintain whitespace as sensibly as possible (collapse where appropriate, but do not remove intentional line breaks).
- Underline is not native in Markdown; store it in IR and map to best-effort equivalents per output format.

### Conversion mapping notes
Markdown:
- Strong/Emphasis map naturally.
- Underline: prefer HTML `<u>` in Markdown output.
- Tables: GitHub-flavored table output for simple tables only.
- Nested lists must preserve indentation carefully.

LaTeX:
- Headings: `\section`, `\subsection`, etc.  After level 3, use `\paragraph`/`\subparagraph` or a consistent mapping.
- Bold/italic: `\textbf{}` and `\textit{}`.
- Underline: `\underline{}`.
- Lists: `itemize` / `enumerate`, including nested environments.
- Tables: basic `tabular`.  Prefer simple column alignment.  Do not attempt longtable by default.
- Escape special characters reliably (`# $ % & ~ _ ^ \ { }`).

Word (.docx):
- Parse .docx into IR using browser-compatible libraries.
- Generate .docx from IR using a browser-compatible generator.
- Keep styling minimal and semantic (bold/italic/underline, heading styles, list levels).
- Tables: build Word tables with basic borders and header row where present.

## Tech stack
Monorepo with two packages:
- `packages/core` (TypeScript): IR, parsers, serializers, shared utilities, tests.
- `packages/web` (TypeScript + React + Vite): UI, workers, file I/O, integration tests.

Suggested libraries (choose browser-compatible options):
- Markdown parse/serialize: `unified`, `remark-parse`, `remark-stringify`, plus minimal plugins.
- LaTeX parse: use a conservative parser (AST-based) if available, otherwise implement a limited LaTeX subset parser for common constructs.  Do not attempt macro expansion.
- Docx parse: `mammoth` (browser build) for extracting a structured HTML-like form, then map to IR.
- Docx generate: `docx` npm package (runs in browser) to create .docx files from IR.

If a library cannot run in the browser without a server, do not use it.

## Repository structure
/
  AGENTS.md
  package.json
  pnpm-workspace.yaml
  packages/
    core/
      src/
        ir/
        markdown/
        latex/
        docx/
        index.ts
      test/
        fixtures/
        helpers/
      vitest.config.ts
      package.json
    web/
      src/
        app/
        components/
        workers/
        adapters/
      test/
      vite.config.ts
      package.json

## Commands
Use pnpm.
- `pnpm install`
- `pnpm -r build`
- `pnpm -r test`
- `pnpm --filter web dev`
- `pnpm --filter web test:e2e` (if implemented)

## Implementation tasks
### 1) Bootstrap
- Create pnpm monorepo.
- Add TypeScript configs (strict).
- Add ESLint + Prettier.
- Add Vitest for unit tests in `core`.
- Add Playwright (optional but recommended) for web UI smoke tests.

### 2) IR
- Implement IR types, validators, and a small normalization pass (for example: merge adjacent Text nodes).
- Add JSON schema export for IR (optional).
- Add `core/src/index.ts` exports.

### 3) Markdown converters
- `parseMarkdownToIR(markdown: string): IRDocument`
- `serializeIRToMarkdown(doc: IRDocument): string`
- Handle: headings, paragraphs, emphasis/strong, underline (HTML), lists (nested), blockquotes, code, links, tables.
- Add tests using fixtures and golden outputs.

### 4) LaTeX converters (best-effort subset)
- Define supported LaTeX subset for input parsing:
  - `\section`..`subsubsection`, `\textbf`, `\textit`, `\underline`
  - `itemize`, `enumerate`
  - `\begin{quote}`
  - `\begin{verbatim}` or `\begin{lstlisting}` (treat as code blocks)
  - `tabular` basic tables
- `parseLatexToIR(latex: string): IRDocument`
- `serializeIRToLatex(doc: IRDocument): string`
- Ensure escaping and balanced braces.
- Add tests for escaping and nested structures.

### 5) Docx converters
- `parseDocxToIR(arrayBuffer: ArrayBuffer): Promise<IRDocument>`
  - Use `mammoth` to extract a structured representation (HTML), then map HTML to IR.
- `serializeIRToDocx(doc: IRDocument): Promise<ArrayBuffer>`
  - Use `docx` to generate .docx with headings, runs, lists, and tables.
- Add fixtures: small .docx files committed under `core/test/fixtures/docx/`.
- Add unit tests that parse fixtures and compare IR snapshots.  For generation, compare re-parsed IR or validate key properties (since binary equality is brittle).

### 6) Web UI
Features:
- Input selectors: upload file, paste text, or drag and drop.
- Format pickers: From / To.
- Preview panes (left input, right output).
- Download output button.
- Error panel with actionable messages.
- Sample documents dropdown to load fixtures.

Performance:
- Use a Web Worker for conversions to avoid blocking UI.
- For docx parsing/generation, do work in the worker if feasible.

Safety:
- Do not execute any content.
- Do not fetch remote images by default.

### 7) Tests
Core unit tests (Vitest):
- IR normalization tests.
- Markdown parse/serialize fixtures.
- LaTeX parse/serialize fixtures.
- Docx parse fixtures.
- Round-trip “shape” tests:
  - Markdown -> IR -> Markdown (semantic equality, not byte equality).
  - LaTeX -> IR -> LaTeX.
  - Docx -> IR -> Docx -> IR (compare stable fields).

Web tests:
- Smoke test: load sample Markdown, convert to LaTeX, verify output contains expected markers.
- Smoke test: load sample docx, convert to Markdown, ensure headings and lists appear.

Fixture set (must include):
- Headings + paragraphs + emphasis.
- Nested mixed lists with 3 levels.
- Tables with header row, and at least one cell containing emphasis.
- Blockquote + code block.
- Links and images.
- Edge cases: empty lines, special characters, and LaTeX-escaped sequences.

## Quality rules
- Prefer correctness and predictability over clever heuristics.
- Log conversion warnings (non-fatal) in a structured way (for example: `{ code, message, nodePath }`).
- When information cannot be represented, degrade gracefully and warn.
- Keep converters deterministic.
- Do not add network dependencies for conversion.

## Acceptance checklist
- Web app runs fully offline after build.
- Conversions work for the fixture set across all pairs.
- Unit tests pass in CI.
- README exists with usage instructions and known limitations.
- A small “Supported features” matrix is documented for each format pair.

## Workflow rules

- If you need npm modules, you need to ask me to do it for you.  You are sandboxed and do not have network access.
- If `CHANGELOG.md` does not exist, create it.
- If `CODEX.md` does not exist, create it.
- After each change, you must do a `git add` and a `git commit` with a relevant message.
- Do not try to `git push`.  You are sandboxed and do not have network access.
- After each change, you must append to `CHANGELOG.md` with the changes performed.
- `CODEX.md` needs to be updated after each change.

## Purpose of CODEX.md (project-agnostic)

`CODEX.md` is a living, centralized reference that explains how a codebase is organized and how to work within it.  It captures:

- The project’s high-level purpose and scope.
- A map of key files, folders, and entry points.
- Data models/schemas and important interfaces.
- Operational notes, workflows, and conventions.
- Known constraints, pitfalls, and non-goals.

In short, it’s the handoff and orientation guide that helps new contributors (human or AI) understand the system quickly and make safe, consistent changes.
