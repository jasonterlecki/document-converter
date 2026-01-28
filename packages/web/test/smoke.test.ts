import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMarkdownToIR,
  parseDocxToIR,
  serializeIRToLatex,
  serializeIRToMarkdown,
} from '@docmorph/core';

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const fixturePath = (...segments: string[]) => resolve(repoRoot, 'packages', 'core', 'test', 'fixtures', ...segments);

const readBuffer = (path: string) => {
  const buffer = readFileSync(path);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

describe('web smoke tests', () => {
  it('converts markdown to latex with expected markers', () => {
    const markdown = readFileSync(fixturePath('markdown', 'basic.md'), 'utf8');
    const ir = parseMarkdownToIR(markdown);
    const latex = serializeIRToLatex(ir);
    expect(latex).toContain('\\section');
    expect(latex).toContain('\\textbf');
  });

  it('converts docx to markdown with headings and lists', async () => {
    const buffer = readBuffer(fixturePath('docx', 'basic.docx'));
    const ir = await parseDocxToIR(buffer);
    const markdown = serializeIRToMarkdown(ir);
    expect(markdown).toContain('#');
    expect(markdown).toContain('Sample');
  });
});
