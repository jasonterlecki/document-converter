import type { Block, Inline, IRDocument } from './types';

export const normalizeDocument = (doc: IRDocument): IRDocument => ({
  ...doc,
  blocks: normalizeBlocks(doc.blocks),
});

const normalizeBlocks = (blocks: Block[]): Block[] =>
  blocks.map((block) => {
    switch (block.type) {
      case 'Paragraph':
        return { ...block, inlines: normalizeInlines(block.inlines) };
      case 'Heading':
        return { ...block, inlines: normalizeInlines(block.inlines) };
      case 'List':
        return {
          ...block,
          items: block.items.map((item) => ({
            ...item,
            blocks: normalizeBlocks(item.blocks),
          })),
        };
      case 'Blockquote':
        return { ...block, blocks: normalizeBlocks(block.blocks) };
      case 'CodeBlock':
      case 'HorizontalRule':
        return block;
      case 'Table':
        return {
          ...block,
          headerRow: block.headerRow
            ? {
                ...block.headerRow,
                cells: block.headerRow.cells.map((cell) => ({
                  ...cell,
                  blocks: normalizeBlocks(cell.blocks),
                })),
              }
            : undefined,
          rows: block.rows.map((row) => ({
            ...row,
            cells: row.cells.map((cell) => ({
              ...cell,
              blocks: normalizeBlocks(cell.blocks),
            })),
          })),
        };
      default:
        return block;
    }
  });

const normalizeInlines = (inlines: Inline[]): Inline[] => {
  const flattened: Inline[] = [];
  for (const inline of inlines) {
    switch (inline.type) {
      case 'Strong':
      case 'Emphasis':
      case 'Underline':
      case 'Link':
        flattened.push({ ...inline, inlines: normalizeInlines(inline.inlines) });
        break;
      default:
        flattened.push(inline);
        break;
    }
  }

  const merged: Inline[] = [];
  for (const inline of flattened) {
    const last = merged[merged.length - 1];
    if (inline.type === 'Text' && last && last.type === 'Text') {
      merged[merged.length - 1] = { ...last, text: `${last.text}${inline.text}` };
      continue;
    }
    if (inline.type === 'Text' && inline.text.length === 0) {
      continue;
    }
    merged.push(inline);
  }
  return merged;
};
