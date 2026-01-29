import type { ConversionRequest, ConversionResponse, Format } from './types';
import { parseMarkdownToIR, serializeIRToMarkdown } from '../../../core/src/markdown/index.ts';
import { parseLatexToIR, serializeIRToLatex } from '../../../core/src/latex/index.ts';

const toIR = (from: Format, content: string | ArrayBuffer) => {
  switch (from) {
    case 'markdown':
      return parseMarkdownToIR(String(content));
    case 'latex':
      return parseLatexToIR(String(content));
    default:
      throw new Error(`Unsupported source format in text worker: ${from}`);
  }
};

const fromIR = (to: Format, ir: ReturnType<typeof toIR>) => {
  switch (to) {
    case 'markdown':
      return serializeIRToMarkdown(ir);
    case 'latex':
      return serializeIRToLatex(ir);
    default:
      throw new Error(`Unsupported target format in text worker: ${to}`);
  }
};

self.onmessage = async (event: MessageEvent<ConversionRequest>) => {
  const { id, from, to, content } = event.data;
  try {
    if (from === to) {
      const output = content;
      const response: ConversionResponse = { id, ok: true, output };
      if (output instanceof ArrayBuffer) {
        self.postMessage(response, [output]);
      } else {
        self.postMessage(response);
      }
      return;
    }

    const ir = toIR(from, content);
    const output = fromIR(to, ir);
    const response: ConversionResponse = { id, ok: true, output };
    self.postMessage(response);
  } catch (error) {
    const response: ConversionResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
