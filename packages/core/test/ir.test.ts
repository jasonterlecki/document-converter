import { describe, expect, it } from 'vitest';
import { IR_VERSION } from '../src/index';

describe('ir', () => {
  it('exports a version', () => {
    expect(IR_VERSION).toBeTypeOf('string');
  });
});
