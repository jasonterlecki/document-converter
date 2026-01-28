import { describe, expect, it } from 'vitest';
import { parseMarkdownToIR, parseDocxToIR, serializeIRToLatex, serializeIRToMarkdown } from '@docmorph/core';
import { samples } from '../src/app/samples';

const base64ToArrayBuffer = (base64: string) => {
  const buffer = Buffer.from(base64, 'base64');
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

describe('web smoke tests', () => {
  it('converts markdown to latex with expected markers', () => {
    const markdownSample = samples.find((sample) => sample.id === 'markdown-basic');
    if (!markdownSample || markdownSample.contentType !== 'text') {
      throw new Error('Missing markdown sample');
    }
    const ir = parseMarkdownToIR(markdownSample.content);
    const latex = serializeIRToLatex(ir);
    expect(latex).toContain('\\section');
    expect(latex).toContain('\\textbf');
  });

  it('converts docx to markdown with headings and lists', async () => {
    const docxSample = samples.find((sample) => sample.id === 'docx-basic');
    if (!docxSample || docxSample.contentType !== 'docx') {
      throw new Error('Missing docx sample');
    }
    const buffer = base64ToArrayBuffer(docxSample.content);
    const ir = await parseDocxToIR(buffer);
    const markdown = serializeIRToMarkdown(ir);
    expect(markdown).toContain('#');
    expect(markdown).toContain('Sample');
  });
});
