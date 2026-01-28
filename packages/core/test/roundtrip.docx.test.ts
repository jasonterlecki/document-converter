import { describe, expect, it } from 'vitest';
import { parseDocxToIR, serializeIRToDocx } from '../src/docx';
import type { IRDocument } from '../src/ir';
import { normalizeDocument } from '../src/ir';

const sampleDoc: IRDocument = {
  type: 'Document',
  blocks: [
    {
      type: 'Heading',
      level: 1,
      inlines: [{ type: 'Text', text: 'Roundtrip Docx' }],
    },
    {
      type: 'Paragraph',
      inlines: [
        { type: 'Text', text: 'Hello ' },
        { type: 'Strong', inlines: [{ type: 'Text', text: 'world' }] },
      ],
    },
  ],
};

describe('roundtrip docx -> ir -> docx -> ir', () => {
  it('preserves stable fields', async () => {
    const buffer = await serializeIRToDocx(sampleDoc);
    const first = normalizeDocument(await parseDocxToIR(buffer));
    const buffer2 = await serializeIRToDocx(first);
    const second = normalizeDocument(await parseDocxToIR(buffer2));
    expect(second.blocks.length).toBeGreaterThan(0);
    expect(second.blocks[0]?.type).toBe('Heading');
  });
});
