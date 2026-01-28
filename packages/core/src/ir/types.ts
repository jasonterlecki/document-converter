export type IRDocument = {
  type: 'Document';
  blocks: Block[];
};

export type Block =
  | Paragraph
  | Heading
  | List
  | Blockquote
  | CodeBlock
  | HorizontalRule
  | Table;

export type Inline =
  | Text
  | Strong
  | Emphasis
  | Underline
  | CodeSpan
  | LineBreak
  | Link
  | Image;

export type Paragraph = {
  type: 'Paragraph';
  inlines: Inline[];
};

export type Heading = {
  type: 'Heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  inlines: Inline[];
};

export type List = {
  type: 'List';
  ordered: boolean;
  items: ListItem[];
};

export type ListItem = {
  type: 'ListItem';
  blocks: Block[];
};

export type Blockquote = {
  type: 'Blockquote';
  blocks: Block[];
};

export type CodeBlock = {
  type: 'CodeBlock';
  text: string;
  language?: string;
};

export type HorizontalRule = {
  type: 'HorizontalRule';
};

export type Table = {
  type: 'Table';
  headerRow?: TableRow;
  rows: TableRow[];
  alignments?: TableAlignment[];
};

export type TableAlignment = 'left' | 'center' | 'right';

export type TableRow = {
  type: 'TableRow';
  cells: TableCell[];
};

export type TableCell = {
  type: 'TableCell';
  blocks: Block[];
};

export type Text = {
  type: 'Text';
  text: string;
};

export type Strong = {
  type: 'Strong';
  inlines: Inline[];
};

export type Emphasis = {
  type: 'Emphasis';
  inlines: Inline[];
};

export type Underline = {
  type: 'Underline';
  inlines: Inline[];
};

export type CodeSpan = {
  type: 'CodeSpan';
  text: string;
};

export type LineBreak = {
  type: 'LineBreak';
};

export type Link = {
  type: 'Link';
  href: string;
  inlines: Inline[];
};

export type Image = {
  type: 'Image';
  src: string;
  alt?: string;
};
