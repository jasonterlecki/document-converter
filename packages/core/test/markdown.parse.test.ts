import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseMarkdownToIR } from '../src/markdown';
import { isIRDocument } from '../src/ir';

const fixturePath = (name: string) =>
  join(__dirname, 'fixtures', 'markdown', name);

describe('parseMarkdownToIR', () => {
  it('parses basic markdown fixture into IR', () => {
    const markdown = readFileSync(fixturePath('basic.md'), 'utf8');
    const doc = parseMarkdownToIR(markdown);
    expect(isIRDocument(doc)).toBe(true);
    expect(doc.blocks.length).toBeGreaterThan(0);
  });

  it('parses edge cases fixture into IR', () => {
    const markdown = readFileSync(fixturePath('edge.md'), 'utf8');
    const doc = parseMarkdownToIR(markdown);
    expect(isIRDocument(doc)).toBe(true);
    expect(doc.blocks.length).toBeGreaterThan(0);
  });
});
