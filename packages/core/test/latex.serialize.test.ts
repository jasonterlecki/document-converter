import { describe, expect, it } from 'vitest';
import type { IRDocument } from '../src/ir';
import { serializeIRToLatex } from '../src/latex';

const sampleDoc: IRDocument = {
  type: 'Document',
  blocks: [
    {
      type: 'Heading',
      level: 2,
      inlines: [{ type: 'Text', text: 'Serialize Test' }],
    },
    {
      type: 'Paragraph',
      inlines: [
        { type: 'Text', text: 'Hello ' },
        { type: 'Strong', inlines: [{ type: 'Text', text: 'world' }] },
        { type: 'Text', text: ' and ' },
        { type: 'Emphasis', inlines: [{ type: 'Text', text: 'friends' }] },
        { type: 'Text', text: '.' },
      ],
    },
  ],
};

describe('serializeIRToLatex', () => {
  it('serializes a minimal IR document', () => {
    const latex = serializeIRToLatex(sampleDoc);
    expect(latex).toContain('\\subsection{Serialize Test}');
    expect(latex).toContain('\\textbf{world}');
    expect(latex).toContain('\\textit{friends}');
  });
});
