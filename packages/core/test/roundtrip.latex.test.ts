import { describe, expect, it } from 'vitest';
import { parseLatexToIR, serializeIRToLatex } from '../src/latex';
import { normalizeDocument } from '../src/ir';

describe('roundtrip latex -> ir -> latex', () => {
  it('preserves structural shape', () => {
    const input = `\\section{Title}\n\nParagraph with \\textbf{bold}, \\textit{italic}, and \\underline{underline}.\n\n\\begin{itemize}\n\\item Item one\n\\item Item two\n\\end{itemize}`;
    const first = normalizeDocument(parseLatexToIR(input));
    const latex = serializeIRToLatex(first);
    const second = normalizeDocument(parseLatexToIR(latex));
    expect(second).toEqual(first);
  });
});
