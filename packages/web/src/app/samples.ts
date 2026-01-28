import type { Format } from '../workers/conversionWorker';

import markdownBasic from '../../../core/test/fixtures/markdown/basic.md?raw';
import latexBasic from '../../../core/test/fixtures/latex/basic.tex?raw';
import docxBasicUrl from '../../../core/test/fixtures/docx/basic.docx?url';

export type Sample = {
  id: string;
  label: string;
  from: Format;
  to: Format;
  contentType: 'text' | 'docx';
  content: string | { url: string };
};

export const samples: Sample[] = [
  {
    id: 'markdown-basic',
    label: 'Markdown: Headings + Lists',
    from: 'markdown',
    to: 'latex',
    contentType: 'text',
    content: markdownBasic,
  },
  {
    id: 'latex-basic',
    label: 'LaTeX: Blocks + Inline',
    from: 'latex',
    to: 'markdown',
    contentType: 'text',
    content: latexBasic,
  },
  {
    id: 'docx-basic',
    label: 'Docx: Basic Fixture',
    from: 'docx',
    to: 'markdown',
    contentType: 'docx',
    content: { url: docxBasicUrl },
  },
];
