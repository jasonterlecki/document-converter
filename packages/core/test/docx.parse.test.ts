import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseDocxToIR } from '../src/docx';
import { isIRDocument } from '../src/ir';

const fixturePath = (name: string) =>
  join(__dirname, 'fixtures', 'docx', name);

describe('parseDocxToIR', () => {
  it('parses basic docx fixture into IR', async () => {
    const buffer = readFileSync(fixturePath('basic.docx'));
    const doc = await parseDocxToIR(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    expect(isIRDocument(doc)).toBe(true);
    expect(doc.blocks.length).toBeGreaterThan(0);
  });

  it('parses edge docx fixture into IR', async () => {
    const buffer = readFileSync(fixturePath('edge.docx'));
    const doc = await parseDocxToIR(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    expect(isIRDocument(doc)).toBe(true);
    expect(doc.blocks.length).toBeGreaterThan(0);
  });
});
