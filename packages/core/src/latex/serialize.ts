import type { Block, Inline, IRDocument, TableAlignment, TableRow, TableCell } from '../ir';

export const serializeIRToLatex = (doc: IRDocument): string => {
  return doc.blocks.map((block) => serializeBlock(block)).join('\n\n');
};

const serializeBlock = (block: Block): string => {
  switch (block.type) {
    case 'Paragraph':
      return serializeInlines(block.inlines);
    case 'Heading':
      return `${headingCommand(block.level)}{${serializeInlines(block.inlines)}}`;
    case 'List':
      return serializeList(block.ordered, block.items);
    case 'Blockquote':
      return `\\begin{quote}\n${block.blocks.map(serializeBlock).join('\n\n')}\n\\end{quote}`;
    case 'CodeBlock':
      return `\\begin{verbatim}\n${block.text}\n\\end{verbatim}`;
    case 'HorizontalRule':
      return '\\hrule';
    case 'Table':
      return serializeTable(block);
    default:
      return '';
  }
};

const headingCommand = (level: number): string => {
  switch (level) {
    case 1:
      return '\\section';
    case 2:
      return '\\subsection';
    case 3:
      return '\\subsubsection';
    case 4:
      return '\\paragraph';
    case 5:
    case 6:
      return '\\subparagraph';
    default:
      return '\\section';
  }
};

const serializeList = (ordered: boolean, items: { blocks: Block[] }[]): string => {
  const env = ordered ? 'enumerate' : 'itemize';
  const body = items
    .map((item) => {
      const blocks = item.blocks.map(serializeBlock).filter(Boolean);
      if (blocks.length === 0) {
        return '\\item';
      }
      const [first, ...rest] = blocks;
      const restBlock = rest.length > 0 ? `\n${rest.join('\n\n')}` : '';
      return `\\item ${first}${restBlock}`;
    })
    .join('\n');
  return `\\begin{${env}}\n${body}\n\\end{${env}}`;
};

const serializeTable = (table: { rows: TableRow[]; headerRow?: TableRow; alignments?: TableAlignment[] }): string => {
  const align = (table.alignments ?? []).map((a) => alignToLatex(a)).join('');
  const alignmentSpec = align.length > 0 ? align : 'l';
  const rows: TableRow[] = [];
  if (table.headerRow) {
    rows.push(table.headerRow);
  }
  rows.push(...table.rows);

  const rowLines = rows.map((row) => serializeTableRow(row));
  const headerLine = table.headerRow ? `\\hline\n${rowLines.shift()}\\\\\n\\hline` : undefined;
  const bodyLines = rowLines.map((line) => `${line}\\\\`).join('\n');
  const body = [headerLine, bodyLines].filter(Boolean).join('\n');

  return `\\begin{tabular}{${alignmentSpec}}\n${body}\n\\end{tabular}`;
};

const serializeTableRow = (row: TableRow): string => {
  return row.cells.map((cell) => serializeTableCell(cell)).join(' & ');
};

const serializeTableCell = (cell: TableCell): string => {
  const inlineText = cell.blocks
    .map((block) => {
      if (block.type === 'Paragraph') {
        return serializeInlines(block.inlines);
      }
      if (block.type === 'CodeBlock') {
        return `\\texttt{${escapeLatex(block.text)}}`;
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
  return inlineText.length > 0 ? inlineText : ' ';
};

const alignToLatex = (align: TableAlignment): string => {
  switch (align) {
    case 'center':
      return 'c';
    case 'right':
      return 'r';
    case 'left':
    default:
      return 'l';
  }
};

const serializeInlines = (inlines: Inline[]): string =>
  inlines.map((inline) => serializeInline(inline)).join('');

const serializeInline = (inline: Inline): string => {
  switch (inline.type) {
    case 'Text':
      return escapeLatex(inline.text);
    case 'Strong':
      return `\\textbf{${serializeInlines(inline.inlines)}}`;
    case 'Emphasis':
      return `\\textit{${serializeInlines(inline.inlines)}}`;
    case 'Underline':
      return `\\underline{${serializeInlines(inline.inlines)}}`;
    case 'CodeSpan':
      return `\\texttt{${escapeLatex(inline.text)}}`;
    case 'LineBreak':
      return '\\newline ';
    case 'Link':
      return `\\href{${escapeLatex(inline.href)}}{${serializeInlines(inline.inlines)}}`;
    case 'Image':
      return `\\includegraphics{${escapeLatex(inline.src)}}`;
    default:
      return '';
  }
};

const escapeLatex = (value: string): string =>
  value
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([#$%&_^{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}');
