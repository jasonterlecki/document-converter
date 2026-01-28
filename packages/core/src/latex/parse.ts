import type { Block, Inline, IRDocument, TableAlignment, TableRow, TableCell } from '../ir';
import { normalizeDocument } from '../ir';

const HEADING_MAP: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  section: 1,
  subsection: 2,
  subsubsection: 3,
  paragraph: 4,
  subparagraph: 5,
};

export const parseLatexToIR = (latex: string): IRDocument => {
  const lines = latex.replace(/\r\n?/g, '\n').split('\n');
  const blocks = parseBlocks(lines);
  return normalizeDocument({ type: 'Document', blocks });
};

const parseBlocks = (lines: string[]): Block[] => {
  const blocks: Block[] = [];
  let paragraph: Inline[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'Paragraph', inlines: paragraph });
      paragraph = [];
    }
  };

  let idx = 0;
  while (idx < lines.length) {
    const line = lines[idx];
    if (line === undefined) {
      break;
    }
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      flushParagraph();
      idx += 1;
      continue;
    }

    const heading = matchHeading(trimmed);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'Heading',
        level: heading.level,
        inlines: heading.inlines,
      });
      idx += 1;
      continue;
    }

    if (trimmed === '\\begin{quote}') {
      flushParagraph();
      const { content, nextIndex } = collectEnvironment(lines, idx + 1, 'quote');
      blocks.push({ type: 'Blockquote', blocks: parseBlocks(content) });
      idx = nextIndex;
      continue;
    }

    if (trimmed === '\\begin{verbatim}' || trimmed === '\\begin{lstlisting}') {
      flushParagraph();
      const envName = trimmed.includes('lstlisting') ? 'lstlisting' : 'verbatim';
      const { rawText, nextIndex } = collectRawEnvironment(lines, idx + 1, envName);
      blocks.push({
        type: 'CodeBlock',
        text: rawText,
        language: envName === 'lstlisting' ? 'text' : undefined,
      });
      idx = nextIndex;
      continue;
    }

    if (trimmed.startsWith('\\begin{itemize}')) {
      flushParagraph();
      const { content, nextIndex } = collectEnvironment(lines, idx + 1, 'itemize');
      blocks.push(parseList(content, false));
      idx = nextIndex;
      continue;
    }

    if (trimmed.startsWith('\\begin{enumerate}')) {
      flushParagraph();
      const { content, nextIndex } = collectEnvironment(lines, idx + 1, 'enumerate');
      blocks.push(parseList(content, true));
      idx = nextIndex;
      continue;
    }

    if (trimmed.startsWith('\\begin{tabular}')) {
      flushParagraph();
      const alignmentSpec = extractTabularAlignment(trimmed);
      const { content, nextIndex } = collectEnvironment(lines, idx + 1, 'tabular');
      blocks.push(parseTable(content, alignmentSpec));
      idx = nextIndex;
      continue;
    }

    if (trimmed === '\\hrule' || trimmed === '\\hline') {
      flushParagraph();
      blocks.push({ type: 'HorizontalRule' });
      idx += 1;
      continue;
    }

    paragraph.push(...parseInline(trimmed));
    idx += 1;
  }

  flushParagraph();
  return blocks;
};

const matchHeading = (line: string): { level: 1 | 2 | 3 | 4 | 5 | 6; inlines: Inline[] } | null => {
  for (const [cmd, level] of Object.entries(HEADING_MAP)) {
    const match = line.match(new RegExp(`^\\\\${cmd}\\{([\\s\\S]*)\\}$`));
    if (match) {
      return { level, inlines: parseInline(match[1] ?? '') };
    }
  }
  return null;
};

const parseList = (lines: string[], ordered: boolean): Block => {
  const items: { type: 'ListItem'; blocks: Block[] }[] = [];
  let buffer: string[] = [];

  const flushItem = () => {
    if (buffer.length === 0) {
      return;
    }
    items.push({ type: 'ListItem', blocks: parseBlocks(buffer) });
    buffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('\\item')) {
      flushItem();
      const after = trimmed.replace('\\item', '').trim();
      if (after.length > 0) {
        buffer.push(after);
      }
      continue;
    }
    buffer.push(line);
  }
  flushItem();

  return {
    type: 'List',
    ordered,
    items,
  };
};

const parseTable = (lines: string[], alignmentSpec: string): Block => {
  const alignments = parseAlignmentSpec(alignmentSpec);
  const rows: TableRow[] = [];

  const joined = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('\\hline'))
    .join(' ');

  const rowParts = joined.split(/\\\\/g).map((part) => part.trim()).filter(Boolean);
  for (const rowText of rowParts) {
    const cells = rowText.split('&').map((cell) => cell.trim());
    const cellNodes: TableCell[] = cells.map((cell) => ({
      type: 'TableCell',
      blocks: [
        {
          type: 'Paragraph',
          inlines: parseInline(cell),
        },
      ],
    }));
    rows.push({ type: 'TableRow', cells: cellNodes });
  }

  return {
    type: 'Table',
    rows,
    alignments: alignments.length > 0 ? alignments : undefined,
  };
};

const collectEnvironment = (
  lines: string[],
  start: number,
  envName: string,
): { content: string[]; nextIndex: number } => {
  const content: string[] = [];
  let idx = start;
  while (idx < lines.length) {
    const line = lines[idx];
    if (line !== undefined && line.trim() === `\\end{${envName}}`) {
      return { content, nextIndex: idx + 1 };
    }
    if (line !== undefined) {
      content.push(line);
    }
    idx += 1;
  }
  return { content, nextIndex: idx };
};

const collectRawEnvironment = (
  lines: string[],
  start: number,
  envName: string,
): { rawText: string; nextIndex: number } => {
  const content: string[] = [];
  let idx = start;
  while (idx < lines.length) {
    const line = lines[idx];
    if (line !== undefined && line.trim() === `\\end{${envName}}`) {
      return { rawText: content.join('\n'), nextIndex: idx + 1 };
    }
    if (line !== undefined) {
      content.push(line);
    }
    idx += 1;
  }
  return { rawText: content.join('\n'), nextIndex: idx };
};

const extractTabularAlignment = (line: string): string => {
  const match = line.match(/\\begin\{tabular\}\{([^}]*)\}/);
  return match ? match[1] ?? '' : '';
};

const parseAlignmentSpec = (spec: string): TableAlignment[] => {
  const alignments: TableAlignment[] = [];
  for (const char of spec.replace(/[^lcr]/g, '')) {
    if (char === 'l') {
      alignments.push('left');
    } else if (char === 'c') {
      alignments.push('center');
    } else if (char === 'r') {
      alignments.push('right');
    }
  }
  return alignments;
};

const parseInline = (text: string): Inline[] => tokenizeInline(text);

const tokenizeInline = (text: string): Inline[] => {
  const output: Inline[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const command = matchInlineCommand(text, cursor);
    if (command) {
      output.push(command.inline);
      cursor = command.nextIndex;
      continue;
    }

    const nextSlash = text.indexOf('\\', cursor);
    const sliceEnd = nextSlash === -1 ? text.length : nextSlash;
    if (sliceEnd > cursor) {
      output.push({ type: 'Text', text: text.slice(cursor, sliceEnd) });
      cursor = sliceEnd;
      continue;
    }

    output.push({ type: 'Text', text: '\\' });
    cursor += 1;
  }

  return output;
};

const matchInlineCommand = (
  text: string,
  cursor: number,
): { inline: Inline; nextIndex: number } | null => {
  const commandMatch = text.slice(cursor).match(/^\\(textbf|textit|underline|href)\{/);
  if (!commandMatch) {
    return null;
  }

  const command = commandMatch[1];
  const braceIndex = cursor + commandMatch[0].length - 1;
  const { content, endIndex } = readBracedContent(text, braceIndex);
  if (endIndex <= braceIndex) {
    return null;
  }

  if (command === 'href') {
    const url = content;
    const nextBrace = endIndex + 1;
    if (text[nextBrace] !== '{') {
      return null;
    }
    const { content: label, endIndex: labelEnd } = readBracedContent(text, nextBrace);
    return {
      inline: { type: 'Link', href: url, inlines: parseInline(label) },
      nextIndex: labelEnd + 1,
    };
  }

  const innerInlines = parseInline(content);
  let inline: Inline;
  if (command === 'textbf') {
    inline = { type: 'Strong', inlines: innerInlines };
  } else if (command === 'textit') {
    inline = { type: 'Emphasis', inlines: innerInlines };
  } else {
    inline = { type: 'Underline', inlines: innerInlines };
  }

  return {
    inline,
    nextIndex: endIndex + 1,
  };
};

const readBracedContent = (text: string, startBrace: number): { content: string; endIndex: number } => {
  let depth = 0;
  let start = startBrace;
  for (let idx = startBrace; idx < text.length; idx += 1) {
    const char = text[idx];
    if (char === '{') {
      depth += 1;
      if (depth === 1) {
        start = idx + 1;
      }
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return { content: text.slice(start, idx), endIndex: idx };
      }
    }
  }
  return { content: text.slice(startBrace + 1), endIndex: text.length - 1 };
};
