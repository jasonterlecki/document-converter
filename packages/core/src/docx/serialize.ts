import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  LevelFormat,
  Numbering,
} from 'docx';
import type { Block, Inline, IRDocument, TableAlignment } from '../ir';

export const serializeIRToDocx = async (doc: IRDocument): Promise<ArrayBuffer> => {
  const paragraphs = doc.blocks.flatMap((block) => serializeBlock(block, 0));
  const numbering = new Numbering({
    config: [
      {
        reference: 'docmorph-numbering',
        levels: [0, 1, 2, 3, 4, 5].map((level) => ({
          level,
          format: LevelFormat.DECIMAL,
          text: `%${level + 1}.`,
          alignment: AlignmentType.START,
        })),
      },
    ],
  });
  const document = new Document({
    numbering,
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(document);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

const serializeBlock = (block: Block, listLevel: number): Array<Paragraph | Table> => {
  switch (block.type) {
    case 'Paragraph':
      return [new Paragraph({ children: serializeInlines(block.inlines) })];
    case 'Heading':
      return [
        new Paragraph({
          text: '',
          heading: headingLevel(block.level),
          children: serializeInlines(block.inlines),
        }),
      ];
    case 'List':
      return block.items.flatMap((item) => serializeListItem(item.blocks, block.ordered, listLevel));
    case 'Blockquote':
      return block.blocks.flatMap((child) => serializeBlock(child, listLevel));
    case 'CodeBlock':
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: block.text,
              font: 'Courier New',
            }),
          ],
        }),
      ];
    case 'HorizontalRule':
      return [new Paragraph({ text: '---' })];
    case 'Table':
      return [serializeTable(block)];
    default:
      return [];
  }
};

const serializeListItem = (
  blocks: Block[],
  ordered: boolean,
  level: number,
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  let isFirst = true;
  for (const block of blocks) {
    if (block.type === 'List') {
      paragraphs.push(...block.items.flatMap((item) => serializeListItem(item.blocks, block.ordered, level + 1)));
      continue;
    }
    const children = block.type === 'Paragraph' ? serializeInlines(block.inlines) : [new TextRun(serializeBlockText(block))];
    paragraphs.push(
      new Paragraph({
        children,
        bullet: ordered ? undefined : { level },
        numbering: ordered ? { reference: 'docmorph-numbering', level } : undefined,
      }),
    );
    if (isFirst) {
      isFirst = false;
    }
  }
  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun('')],
        bullet: ordered ? undefined : { level },
        numbering: ordered ? { reference: 'docmorph-numbering', level } : undefined,
      }),
    );
  }
  return paragraphs;
};

const serializeBlockText = (block: Block): string => {
  if (block.type === 'CodeBlock') {
    return block.text;
  }
  if (block.type === 'Paragraph') {
    return block.inlines.map((inline) => inlineToText(inline)).join('');
  }
  return '';
};

const serializeTable = (table: { rows: { cells: { blocks: Block[] }[] }[]; headerRow?: { cells: { blocks: Block[] }[] }; alignments?: TableAlignment[] }): Table => {
  const rows = [] as TableRow[];
  if (table.headerRow) {
    rows.push(serializeTableRow(table.headerRow, table.alignments));
  }
  rows.push(...table.rows.map((row) => serializeTableRow(row, table.alignments)));

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

const serializeTableRow = (
  row: { cells: { blocks: Block[] }[] },
  alignments?: TableAlignment[],
): TableRow => {
  return new TableRow({
    children: row.cells.map((cell, index) => serializeTableCell(cell, alignments?.[index])),
  });
};

  const serializeTableCell = (
    cell: { blocks: Block[] },
    _alignment?: TableAlignment,
  ): TableCell => {
    const paragraphs = cell.blocks.flatMap((block) => serializeBlock(block, 0));
    return new TableCell({
      children: paragraphs.length > 0 ? paragraphs : [new Paragraph('')],
      verticalAlign: 'center',
    columnSpan: 1,
    margins: {
      top: 100,
      bottom: 100,
      left: 100,
      right: 100,
    },
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

const headingLevel = (level: number): HeadingLevel => {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
};

const serializeInlines = (inlines: Inline[]): TextRun[] => {
  const runs: TextRun[] = [];
  for (const inline of inlines) {
    runs.push(...serializeInline(inline));
  }
  return runs;
};

const serializeInline = (inline: Inline): TextRun[] => {
  switch (inline.type) {
    case 'Text':
      return [new TextRun(inline.text)];
    case 'Strong':
      return [new TextRun({ text: inline.inlines.map(inlineToText).join(''), bold: true })];
    case 'Emphasis':
      return [new TextRun({ text: inline.inlines.map(inlineToText).join(''), italics: true })];
    case 'Underline':
      return [new TextRun({ text: inline.inlines.map(inlineToText).join(''), underline: {} })];
    case 'CodeSpan':
      return [new TextRun({ text: inline.text, font: 'Courier New' })];
    case 'LineBreak':
      return [new TextRun({ text: '\n' })];
    case 'Link': {
      const label = inline.inlines.map(inlineToText).join('');
      const href = inline.href;
      const text = href ? `${label} (${href})` : label;
      return [new TextRun({ text, underline: {}, color: '1155cc' })];
    }
    case 'Image': {
      const label = inline.alt ?? 'image';
      const src = inline.src ? ` ${inline.src}` : '';
      return [new TextRun(`[${label}${src}]`)];
    }
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
      return inline.alt ?? inline.src;
    default:
      return '';
  }
};
