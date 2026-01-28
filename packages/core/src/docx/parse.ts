import mammoth from 'mammoth';
import { parseHTML } from 'linkedom';
import type {
  Block,
  Inline,
  IRDocument,
  TableAlignment,
  TableRow,
  TableCell,
} from '../ir';
import { normalizeDocument } from '../ir';

export const parseDocxToIR = async (inputData: ArrayBuffer | Buffer): Promise<IRDocument> => {
  const input = resolveMammothInput(inputData);
  const result = await mammoth.convertToHtml(input);
  const html = result.value ?? '';

  if (html.trim().length === 0) {
    const raw = await mammoth.extractRawText(input);
    const blocks = raw.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => ({ type: 'Paragraph', inlines: [{ type: 'Text', text: line }] } as Block));
    return normalizeDocument({ type: 'Document', blocks });
  }

  const { document } = parseHTML(`<div id="docmorph-root">${html}</div>`);
  const root = document.querySelector('#docmorph-root');
  const blocks = root ? mapBlockChildren(root) : [];
  return normalizeDocument({ type: 'Document', blocks });
};

const resolveMammothInput = (
  inputData: ArrayBuffer | Buffer,
): { arrayBuffer?: ArrayBuffer; buffer?: Buffer } => {
  const NodeBuffer = (globalThis as unknown as { Buffer?: typeof Buffer }).Buffer;
  if (NodeBuffer) {
    if (NodeBuffer.isBuffer(inputData)) {
      return { buffer: inputData };
    }
    return { buffer: NodeBuffer.from(inputData) };
  }
  return { arrayBuffer: inputData as ArrayBuffer };
};

const mapBlockChildren = (parent: Element): Block[] => {
  const blocks: Block[] = [];
  parent.childNodes.forEach((node) => {
    blocks.push(...mapBlockNode(node));
  });
  return blocks;
};

const mapBlockNode = (node: Node): Block[] => {
  if (node.nodeType === 3) {
    const text = node.textContent ?? '';
    if (text.trim().length === 0) {
      return [];
    }
    return [{ type: 'Paragraph', inlines: [{ type: 'Text', text }] }];
  }
  if (node.nodeType !== 1) {
    return [];
  }
  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case 'p':
      return [{ type: 'Paragraph', inlines: mapInlineChildren(element) }];
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return [
        {
          type: 'Heading',
          level: parseInt(tag.replace('h', ''), 10) as 1 | 2 | 3 | 4 | 5 | 6,
          inlines: mapInlineChildren(element),
        },
      ];
    case 'ul':
      return [mapList(element, false)];
    case 'ol':
      return [mapList(element, true)];
    case 'blockquote':
      return [{ type: 'Blockquote', blocks: mapBlockChildren(element) }];
    case 'pre':
      return [
        {
          type: 'CodeBlock',
          text: element.textContent ?? '',
        },
      ];
    case 'hr':
      return [{ type: 'HorizontalRule' }];
    case 'table':
      return [mapTable(element)];
    default:
      return [];
  }
};

const mapList = (element: Element, ordered: boolean): Block => {
  const items = Array.from(element.children)
    .filter((child) => child.tagName.toLowerCase() === 'li')
    .map((li) => ({
      type: 'ListItem',
      blocks: normalizeListItemBlocks(mapBlockChildren(li)),
    }));

  return { type: 'List', ordered, items };
};

const normalizeListItemBlocks = (blocks: Block[]): Block[] => {
  if (blocks.length === 0) {
    return [{ type: 'Paragraph', inlines: [] }];
  }
  return blocks;
};

const mapTable = (element: Element): Block => {
  const rows: TableRow[] = [];
  const alignments: TableAlignment[] = [];
  let hasHeader = false;

  const rowElements = element.querySelectorAll('tr');
  rowElements.forEach((rowElement) => {
    const cells = Array.from(rowElement.children)
      .filter((child) => ['td', 'th'].includes(child.tagName.toLowerCase()))
      .map((cellElement) => ({
        type: 'TableCell',
        blocks: mapBlockChildren(cellElement),
      } as TableCell));

    if (!hasHeader) {
      hasHeader = Array.from(rowElement.children).some(
        (child) => child.tagName.toLowerCase() === 'th',
      );
    }
    rows.push({ type: 'TableRow', cells });
  });

  const headerRow = hasHeader && rows.length > 0 ? rows[0] : undefined;
  const bodyRows = headerRow ? rows.slice(1) : rows;

  return {
    type: 'Table',
    headerRow,
    rows: bodyRows,
    alignments: alignments.length > 0 ? alignments : undefined,
  };
};

const mapInlineChildren = (element: Element): Inline[] => {
  const inlines: Inline[] = [];
  element.childNodes.forEach((node) => {
    inlines.push(...mapInlineNode(node));
  });
  return inlines;
};

const mapInlineNode = (node: Node): Inline[] => {
  if (node.nodeType === 3) {
    const text = node.textContent ?? '';
    return text.length > 0 ? [{ type: 'Text', text }] : [];
  }
  if (node.nodeType !== 1) {
    return [];
  }
  const element = node as Element;
  const tag = element.tagName.toLowerCase();

  switch (tag) {
    case 'strong':
    case 'b':
      return [{ type: 'Strong', inlines: mapInlineChildren(element) }];
    case 'em':
    case 'i':
      return [{ type: 'Emphasis', inlines: mapInlineChildren(element) }];
    case 'u':
      return [{ type: 'Underline', inlines: mapInlineChildren(element) }];
    case 'code':
      return [{ type: 'CodeSpan', text: element.textContent ?? '' }];
    case 'br':
      return [{ type: 'LineBreak' }];
    case 'a':
      return [
        {
          type: 'Link',
          href: element.getAttribute('href') ?? '',
          inlines: mapInlineChildren(element),
        },
      ];
    case 'img':
      return [
        {
          type: 'Image',
          src: element.getAttribute('src') ?? '',
          alt: element.getAttribute('alt') ?? undefined,
        },
      ];
    case 'span':
      if (element.getAttribute('style')?.includes('underline')) {
        return [{ type: 'Underline', inlines: mapInlineChildren(element) }];
      }
      return mapInlineChildren(element);
    default:
      return mapInlineChildren(element);
  }
};
