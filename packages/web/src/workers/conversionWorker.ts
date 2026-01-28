import {
  parseMarkdownToIR,
  parseLatexToIR,
  parseDocxToIR,
  serializeIRToMarkdown,
  serializeIRToLatex,
  serializeIRToDocx,
} from '@docmorph/core';

export type Format = 'markdown' | 'latex' | 'docx';

export type ConversionRequest = {
  id: string;
  from: Format;
  to: Format;
  content: string | ArrayBuffer;
};

export type ConversionResponse = {
  id: string;
  ok: boolean;
  output?: string | ArrayBuffer;
  error?: string;
};

const toIR = async (from: Format, content: string | ArrayBuffer) => {
  switch (from) {
    case 'markdown':
      return parseMarkdownToIR(String(content));
    case 'latex':
      return parseLatexToIR(String(content));
    case 'docx':
      return parseDocxToIR(content as ArrayBuffer);
    default:
      throw new Error(`Unsupported source format: ${from}`);
  }
};

const fromIR = async (to: Format, ir: Awaited<ReturnType<typeof toIR>>) => {
  switch (to) {
    case 'markdown':
      return serializeIRToMarkdown(ir);
    case 'latex':
      return serializeIRToLatex(ir);
    case 'docx':
      return serializeIRToDocx(ir);
    default:
      throw new Error(`Unsupported target format: ${to}`);
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

    const ir = await toIR(from, content);
    const output = await fromIR(to, ir);
    const response: ConversionResponse = { id, ok: true, output };
    if (output instanceof ArrayBuffer) {
      self.postMessage(response, [output]);
    } else {
      self.postMessage(response);
    }
  } catch (error) {
    const response: ConversionResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    self.postMessage(response);
  }
};
