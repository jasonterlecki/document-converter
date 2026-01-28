export type {
  IRDocument,
  Block,
  Inline,
  Paragraph,
  Heading,
  List,
  ListItem,
  Blockquote,
  CodeBlock,
  HorizontalRule,
  Table,
  TableRow,
  TableCell,
  TableAlignment,
  Text,
  Strong,
  Emphasis,
  Underline,
  CodeSpan,
  LineBreak,
  Link,
  Image,
} from './types';

export { isIRDocument, isBlock, isInline, validateDocument } from './validators';
export { normalizeDocument } from './normalize';
