import { unified } from 'unified';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import type { Root, RootContent, PhrasingContent, TableCell, TableRow } from 'mdast';
import type {
  Block,
  Inline,
  IRDocument,
  Table,
  TableAlignment,
  TableCell as IRTableCell,
  TableRow as IRTableRow,
} from '../ir';

const serializer = unified().use(remarkStringify).use(remarkGfm);

export const serializeIRToMarkdown = (doc: IRDocument): string => {
  const tree: Root = {
    type: 'root',
    children: doc.blocks.flatMap((block) => mapBlock(block)),
  };

  return String(serializer.stringify(tree));
};

const mapBlock = (block: Block): RootContent[] => {
  switch (block.type) {
    case 'Paragraph':
      return [{ type: 'paragraph', children: mapInlines(block.inlines) }];
    case 'Heading':
      return [
        {
          type: 'heading',
          depth: block.level,
          children: mapInlines(block.inlines),
        },
      ];
    case 'List':
      return [
        {
          type: 'list',
          ordered: block.ordered,
          spread: false,
          children: block.items.map((item) => ({
            type: 'listItem',
            spread: false,
            children: item.blocks.flatMap((child) => mapBlock(child)),
          })),
        },
      ];
    case 'Blockquote':
      return [
        {
          type: 'blockquote',
          children: block.blocks.flatMap((child) => mapBlock(child)),
        },
      ];
    case 'CodeBlock':
      return [
        {
          type: 'code',
          lang: block.language ?? null,
          value: block.text,
        },
      ];
    case 'HorizontalRule':
      return [{ type: 'thematicBreak' }];
    case 'Table':
      return [mapTable(block)];
    default:
      return [];
  }
};

const mapTable = (table: Table): RootContent => {
  const rows: IRTableRow[] = [];
  if (table.headerRow) {
    rows.push(table.headerRow);
  }
  rows.push(...table.rows);

  return {
    type: 'table',
    align: table.alignments?.map((align) => alignFromIR(align)) ?? undefined,
    children: rows.map(mapTableRow),
  };
};

const alignFromIR = (align: TableAlignment): 'left' | 'right' | 'center' => {
  switch (align) {
    case 'center':
    case 'right':
    case 'left':
      return align;
  }
};

const mapTableRow = (row: IRTableRow): TableRow => ({
  type: 'tableRow',
  children: row.cells.map(mapTableCell),
});

const mapTableCell = (cell: IRTableCell): TableCell => ({
  type: 'tableCell',
  children: blocksToPhrasing(cell.blocks),
});

const blocksToPhrasing = (blocks: Block[]): PhrasingContent[] => {
  const inlines: Inline[] = [];
  for (const block of blocks) {
    if (block.type === 'Paragraph') {
      inlines.push(...block.inlines);
    } else if (block.type === 'CodeBlock') {
      inlines.push({ type: 'CodeSpan', text: block.text });
    }
  }
  if (inlines.length === 0) {
    return [{ type: 'text', value: '' }];
  }
  return mapInlines(inlines);
};

const mapInlines = (inlines: Inline[]): PhrasingContent[] =>
  inlines.flatMap((inline) => mapInline(inline));

const mapInline = (inline: Inline): PhrasingContent[] => {
  switch (inline.type) {
    case 'Text':
      return [{ type: 'text', value: inline.text }];
    case 'Strong':
      return [{ type: 'strong', children: mapInlines(inline.inlines) }];
    case 'Emphasis':
      return [{ type: 'emphasis', children: mapInlines(inline.inlines) }];
    case 'Underline':
      return [{ type: 'html', value: `<u>${inline.inlines.map(inlineToText).join('')}</u>` }];
    case 'CodeSpan':
      return [{ type: 'inlineCode', value: inline.text }];
    case 'LineBreak':
      return [{ type: 'break' }];
    case 'Link':
      return [{ type: 'link', url: inline.href, children: mapInlines(inline.inlines) }];
    case 'Image':
      return [{ type: 'image', url: inline.src, alt: inline.alt ?? '' }];
    default:
      return [];
  }
};

const inlineToText = (inline: Inline): string => {
  switch (inline.type) {
    case 'Text':
      return inline.text;
    case 'CodeSpan':
      return inline.text;
    case 'LineBreak':
      return '\n';
    case 'Strong':
    case 'Emphasis':
    case 'Underline':
    case 'Link':
      return inline.inlines.map(inlineToText).join('');
    case 'Image':
      return inline.alt ?? '';
    default:
      return '';
  }
};
