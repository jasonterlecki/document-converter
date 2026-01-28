import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseLatexToIR } from '../src/latex';
import { isIRDocument } from '../src/ir';

const fixturePath = (name: string) =>
  join(__dirname, 'fixtures', 'latex', name);

describe('parseLatexToIR', () => {
  it('parses basic LaTeX fixture into IR', () => {
    const latex = readFileSync(fixturePath('basic.tex'), 'utf8');
    const doc = parseLatexToIR(latex);
    expect(isIRDocument(doc)).toBe(true);
    expect(doc.blocks.length).toBeGreaterThan(0);
  });

  it('parses edge case fixture into IR', () => {
    const latex = readFileSync(fixturePath('edge.tex'), 'utf8');
    const doc = parseLatexToIR(latex);
    expect(isIRDocument(doc)).toBe(true);
    expect(doc.blocks.length).toBeGreaterThan(0);
  });
});
