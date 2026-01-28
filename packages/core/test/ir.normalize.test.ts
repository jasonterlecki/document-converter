import { describe, expect, it } from 'vitest';
import type { IRDocument } from '../src/ir';
import { normalizeDocument } from '../src/ir';

describe('normalizeDocument', () => {
  it('merges adjacent text nodes', () => {
    const doc: IRDocument = {
      type: 'Document',
      blocks: [
        {
          type: 'Paragraph',
          inlines: [
            { type: 'Text', text: 'Hello ' },
            { type: 'Text', text: 'world' },
          ],
        },
      ],
    };

    const normalized = normalizeDocument(doc);
    const paragraph = normalized.blocks[0];
    if (paragraph?.type !== 'Paragraph') {
      throw new Error('Expected paragraph');
    }
    expect(paragraph.inlines).toEqual([{ type: 'Text', text: 'Hello world' }]);
  });

  it('normalizes nested inline containers', () => {
    const doc: IRDocument = {
      type: 'Document',
      blocks: [
        {
          type: 'Paragraph',
          inlines: [
            {
              type: 'Strong',
              inlines: [
                { type: 'Text', text: 'A' },
                { type: 'Text', text: 'B' },
              ],
            },
          ],
        },
      ],
    };

    const normalized = normalizeDocument(doc);
    const paragraph = normalized.blocks[0];
    if (paragraph?.type !== 'Paragraph') {
      throw new Error('Expected paragraph');
    }
    expect(paragraph.inlines).toEqual([
      { type: 'Strong', inlines: [{ type: 'Text', text: 'AB' }] },
    ]);
  });
});
