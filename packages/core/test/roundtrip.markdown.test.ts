import { describe, expect, it } from 'vitest';
import { parseMarkdownToIR, serializeIRToMarkdown } from '../src/markdown';
import { normalizeDocument } from '../src/ir';

const normalizeMd = (markdown: string) =>
  normalizeDocument(parseMarkdownToIR(markdown));

describe('roundtrip markdown -> ir -> markdown', () => {
  it('preserves structural shape', () => {
    const input = `# Title\n\nParagraph with **bold**, *italic*, and <u>underline</u>.\n\n- Item one\n  - Nested item\n\n| Name | Value |\n| --- | --- |\n| Alpha | *italic* |\n`;
    const first = normalizeMd(input);
    const markdown = serializeIRToMarkdown(first);
    const second = normalizeMd(markdown);
    expect(second).toEqual(first);
  });
});
