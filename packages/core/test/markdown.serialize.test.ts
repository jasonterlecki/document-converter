import { describe, expect, it } from 'vitest';
import { serializeIRToMarkdown } from '../src/markdown';
import type { IRDocument } from '../src/ir';

const sampleDoc: IRDocument = {
  type: 'Document',
  blocks: [
    {
      type: 'Heading',
      level: 1,
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
    {
      type: 'List',
      ordered: false,
      items: [
        {
          type: 'ListItem',
          blocks: [
            {
              type: 'Paragraph',
              inlines: [{ type: 'Text', text: 'Item' }],
            },
          ],
        },
      ],
    },
  ],
};

describe('serializeIRToMarkdown', () => {
  it('serializes a minimal IR document', () => {
    const markdown = serializeIRToMarkdown(sampleDoc);
    expect(markdown).toContain('# Serialize Test');
    expect(markdown).toContain('**world**');
    expect(markdown).toContain('*friends*');
    expect(markdown).toContain('* Item');
  });
});
