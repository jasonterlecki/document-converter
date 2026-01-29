import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type {
  Block,
  Inline,
  IRDocument,
  TableAlignment,
  TableRow,
  TableCell,
} from '../ir';
import { normalizeDocument } from '../ir';
import type {
  Content,
  PhrasingContent,
  Root,
  RootContent,
  TableCell as MdTableCell,
  TableRow as MdTableRow,
} from 'mdast';

const parser = unified().use(remarkParse).use(remarkGfm);

export const parseMarkdownToIR = (markdown: string): IRDocument => {
  const tree = parser.parse(markdown) as Root;
  const blocks = tree.children.flatMap((node) => mapRootContent(node));
  return normalizeDocument({ type: 'Document', blocks });
};

const mapRootContent = (node: RootContent): Block[] => {
  switch (node.type) {
    case 'paragraph':
      return [
        {
          type: 'Paragraph',
          inlines: mapPhrasing(node.children),
        },
      ];
    case 'heading':
      return [
        {
          type: 'Heading',
          level: node.depth as 1 | 2 | 3 | 4 | 5 | 6,
          inlines: mapPhrasing(node.children),
        },
      ];
    case 'list':
      return [
        {
          type: 'List',
          ordered: node.ordered ?? false,
          items: node.children.map((item) => ({
            type: 'ListItem',
            blocks: item.children.flatMap((child) => mapRootContent(child)),
          })),
        },
      ];
    case 'blockquote':
      return [
        {
          type: 'Blockquote',
          blocks: node.children.flatMap((child) => mapRootContent(child)),
        },
      ];
    case 'code':
      return [
        {
          type: 'CodeBlock',
          text: node.value ?? '',
          language: node.lang ?? undefined,
        },
      ];
    case 'thematicBreak':
      return [{ type: 'HorizontalRule' }];
    case 'table':
      return [mapTable(node)];
    default:
      return [];
  }
};

const mapTable = (node: Extract<RootContent, { type: 'table' }>): Block => {
  const rows = node.children.map(mapTableRow);
  const headerRow = rows.length > 0 ? rows[0] : undefined;
  const bodyRows = rows.length > 1 ? rows.slice(1) : [];
  const alignments = node.align?.map((align) => alignToIR(align)) ?? undefined;

  return {
    type: 'Table',
    headerRow,
    rows: bodyRows,
    alignments,
  };
};

const alignToIR = (align: string | null): TableAlignment | undefined => {
  switch (align) {
    case 'left':
    case 'center':
    case 'right':
      return align;
    default:
      return undefined;
  }
};

const mapTableRow = (row: MdTableRow): TableRow => ({
  type: 'TableRow',
  cells: row.children.map(mapTableCell),
});

const mapTableCell = (cell: MdTableCell): TableCell => ({
  type: 'TableCell',
  blocks: [
    {
      type: 'Paragraph',
      inlines: mapPhrasing(cell.children as PhrasingContent[]),
    },
  ],
});

const mapPhrasing = (nodes: PhrasingContent[]): Inline[] =>
  nodes.flatMap((node) => mapPhrasingNode(node));

const mapPhrasingNode = (node: PhrasingContent): Inline[] => {
  switch (node.type) {
    case 'text':
      return mapTextWithUnderline(node.value);
    case 'strong':
      return [{ type: 'Strong', inlines: mapPhrasing(node.children) }];
    case 'emphasis':
      return [{ type: 'Emphasis', inlines: mapPhrasing(node.children) }];
    case 'delete':
      return mapPhrasing(node.children);
    case 'inlineCode':
      return [{ type: 'CodeSpan', text: node.value }];
    case 'break':
      return [{ type: 'LineBreak' }];
    case 'link':
      return [{ type: 'Link', href: node.url, inlines: mapPhrasing(node.children) }];
    case 'image':
      return [{ type: 'Image', src: node.url, alt: node.alt ?? undefined }];
    case 'html':
      return mapHtmlInline(node.value);
    default:
      return [];
  }
};

const mapHtmlInline = (value: string): Inline[] => mapHtmlWithUnderline(value);

const mapTextWithUnderline = (value: string): Inline[] => {
  return mapHtmlWithUnderline(value);
};

const mapHtmlWithUnderline = (value: string): Inline[] => {
  const result: Inline[] = [];
  let remaining = value;
  const pattern = /<u>([\s\S]+?)<\/u>/i;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      result.push({ type: 'Text', text: remaining });
      break;
    }
    const before = remaining.slice(0, match.index);
    if (before.length > 0) {
      result.push({ type: 'Text', text: before });
    }
    const content = match[1] ?? '';
    result.push({ type: 'Underline', inlines: [{ type: 'Text', text: content }] });
    remaining = remaining.slice(match.index + match[0].length);
  }

  return result;
};
