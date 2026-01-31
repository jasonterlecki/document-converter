import { describe, expect, it } from 'vitest';
import type { IRDocument, Inline, Block } from '../src/ir';
import { parseDocxToIR, serializeIRToDocx } from '../src/docx';

const sampleDoc: IRDocument = {
  type: 'Document',
  blocks: [
    {
      type: 'Heading',
      level: 1,
      inlines: [{ type: 'Text', text: 'Docx Serialize Test' }],
    },
    {
      type: 'Paragraph',
      inlines: [
        { type: 'Text', text: 'Hello ' },
        { type: 'Strong', inlines: [{ type: 'Text', text: 'world' }] },
        { type: 'Text', text: ' and ' },
        {
          type: 'Link',
          href: 'https://example.com',
          inlines: [{ type: 'Text', text: 'link' }],
        },
        { type: 'Text', text: ' plus ' },
        { type: 'Image', src: 'https://example.com/image.png', alt: 'image' },
        { type: 'Text', text: ' and ' },
        { type: 'Underline', inlines: [{ type: 'Text', text: 'underline' }] },
      ],
    },
  ],
};

describe('serializeIRToDocx', () => {
  it('serializes and re-parses key content', async () => {
    const buffer = await serializeIRToDocx(sampleDoc);
    const parsed = await parseDocxToIR(buffer);
    const text = extractText(parsed.blocks).join(' ');
    expect(text).toContain('Docx Serialize Test');
    expect(text).toContain('Hello');
    expect(text).toContain('world');
    expect(text).toContain('link');
    expect(text).toContain('https://example.com');
    expect(text).toContain('image');
    expect(hasUnderline(parsed.blocks)).toBe(true);
  });
});

const extractText = (blocks: Block[]): string[] => {
  const parts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'Paragraph' || block.type === 'Heading') {
      parts.push(inlinesToText(block.inlines));
    } else if (block.type === 'List') {
      block.items.forEach((item) => parts.push(...extractText(item.blocks)));
    } else if (block.type === 'Blockquote') {
      parts.push(...extractText(block.blocks));
    } else if (block.type === 'Table') {
      if (block.headerRow) {
        parts.push(...extractTableRow(block.headerRow));
      }
      block.rows.forEach((row) => parts.push(...extractTableRow(row)));
    }
  }
  return parts;
};

const extractTableRow = (row: { cells: { blocks: Block[] }[] }): string[] =>
  row.cells.flatMap((cell) => extractText(cell.blocks));

const inlinesToText = (inlines: Inline[]): string =>
  inlines
    .map((inline) => {
      switch (inline.type) {
        case 'Text':
          return inline.text;
        case 'Strong':
        case 'Emphasis':
        case 'Underline':
        case 'Link':
          return inlinesToText(inline.inlines);
        case 'CodeSpan':
          return inline.text;
        case 'LineBreak':
          return ' ';
        case 'Image':
          return inline.alt ?? '';
        default:
          return '';
      }
    })
    .join('');

const hasUnderline = (blocks: Block[]): boolean => {
  for (const block of blocks) {
    if (block.type === 'Paragraph' || block.type === 'Heading') {
      if (containsUnderline(block.inlines)) {
        return true;
      }
    } else if (block.type === 'List') {
      if (block.items.some((item) => hasUnderline(item.blocks))) {
        return true;
      }
    } else if (block.type === 'Blockquote') {
      if (hasUnderline(block.blocks)) {
        return true;
      }
    } else if (block.type === 'Table') {
      if (block.headerRow && hasUnderline(extractTableRowBlocks(block.headerRow))) {
        return true;
      }
      if (block.rows.some((row) => hasUnderline(extractTableRowBlocks(row)))) {
        return true;
      }
    }
  }
  return false;
};

const containsUnderline = (inlines: Inline[]): boolean =>
  inlines.some((inline) => {
    if (inline.type === 'Underline') {
      return true;
    }
    if (inline.type === 'Strong' || inline.type === 'Emphasis' || inline.type === 'Link') {
      return containsUnderline(inline.inlines);
    }
    return false;
  });

const extractTableRowBlocks = (row: { cells: { blocks: Block[] }[] }): Block[] =>
  row.cells.flatMap((cell) => cell.blocks);
