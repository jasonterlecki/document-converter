import type {
  Block,
  Blockquote,
  CodeBlock,
  Heading,
  HorizontalRule,
  Inline,
  IRDocument,
  List,
  ListItem,
  Paragraph,
  Table,
  TableAlignment,
  TableCell,
  TableRow,
} from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isTableAlignment = (value: unknown): value is TableAlignment =>
  value === 'left' || value === 'center' || value === 'right';

export const isIRDocument = (value: unknown): value is IRDocument => {
  if (!isRecord(value) || value.type !== 'Document') {
    return false;
  }
  if (!Array.isArray(value.blocks)) {
    return false;
  }
  return value.blocks.every(isBlock);
};

export const isBlock = (value: unknown): value is Block => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }
  switch (value.type) {
    case 'Paragraph':
      return isParagraph(value);
    case 'Heading':
      return isHeading(value);
    case 'List':
      return isList(value);
    case 'Blockquote':
      return isBlockquote(value);
    case 'CodeBlock':
      return isCodeBlock(value);
    case 'HorizontalRule':
      return isHorizontalRule(value);
    case 'Table':
      return isTable(value);
    default:
      return false;
  }
};

export const isInline = (value: unknown): value is Inline => {
  if (!isRecord(value) || typeof value.type !== 'string') {
    return false;
  }
  switch (value.type) {
    case 'Text':
      return typeof value.text === 'string';
    case 'Strong':
    case 'Emphasis':
    case 'Underline':
      return Array.isArray(value.inlines) && value.inlines.every(isInline);
    case 'CodeSpan':
      return typeof value.text === 'string';
    case 'LineBreak':
      return true;
    case 'Link':
      return typeof value.href === 'string' && Array.isArray(value.inlines) && value.inlines.every(isInline);
    case 'Image':
      return typeof value.src === 'string' && (value.alt === undefined || typeof value.alt === 'string');
    default:
      return false;
  }
};

const isParagraph = (value: Record<string, unknown>): value is Paragraph =>
  value.type === 'Paragraph' && Array.isArray(value.inlines) && value.inlines.every(isInline);

const isHeading = (value: Record<string, unknown>): value is Heading =>
  value.type === 'Heading' &&
  [1, 2, 3, 4, 5, 6].includes(value.level as number) &&
  Array.isArray(value.inlines) &&
  value.inlines.every(isInline);

const isList = (value: Record<string, unknown>): value is List =>
  value.type === 'List' &&
  typeof value.ordered === 'boolean' &&
  Array.isArray(value.items) &&
  value.items.every(isListItem);

const isListItem = (value: unknown): value is ListItem =>
  isRecord(value) && value.type === 'ListItem' && Array.isArray(value.blocks) && value.blocks.every(isBlock);

const isBlockquote = (value: Record<string, unknown>): value is Blockquote =>
  value.type === 'Blockquote' && Array.isArray(value.blocks) && value.blocks.every(isBlock);

const isCodeBlock = (value: Record<string, unknown>): value is CodeBlock =>
  value.type === 'CodeBlock' &&
  typeof value.text === 'string' &&
  (value.language === undefined || typeof value.language === 'string');

const isHorizontalRule = (value: Record<string, unknown>): value is HorizontalRule =>
  value.type === 'HorizontalRule';

const isTable = (value: Record<string, unknown>): value is Table => {
  if (value.type !== 'Table' || !Array.isArray(value.rows)) {
    return false;
  }
  if (value.headerRow !== undefined && !isTableRow(value.headerRow)) {
    return false;
  }
  if (!value.rows.every(isTableRow)) {
    return false;
  }
  if (value.alignments !== undefined) {
    if (!Array.isArray(value.alignments)) {
      return false;
    }
    if (!value.alignments.every(isTableAlignment)) {
      return false;
    }
  }
  return true;
};

const isTableRow = (value: unknown): value is TableRow =>
  isRecord(value) && value.type === 'TableRow' && Array.isArray(value.cells) && value.cells.every(isTableCell);

const isTableCell = (value: unknown): value is TableCell =>
  isRecord(value) && value.type === 'TableCell' && Array.isArray(value.blocks) && value.blocks.every(isBlock);

export const validateDocument = (value: unknown): string[] => {
  if (!isIRDocument(value)) {
    return ['Value is not a valid IRDocument'];
  }
  return [];
};
