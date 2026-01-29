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

const loadMarkdown = async () => import('@docmorph/core/markdown');
const loadLatex = async () => import('@docmorph/core/latex');
const loadDocx = async () => import('@docmorph/core/docx');

const toIR = async (from: Format, content: string | ArrayBuffer) => {
  switch (from) {
    case 'markdown':
      return (await loadMarkdown()).parseMarkdownToIR(String(content));
    case 'latex':
      return (await loadLatex()).parseLatexToIR(String(content));
    case 'docx':
      return (await loadDocx()).parseDocxToIR(content as ArrayBuffer);
    default:
      throw new Error(`Unsupported source format: ${from}`);
  }
};

const fromIR = async (to: Format, ir: Awaited<ReturnType<typeof toIR>>) => {
  switch (to) {
    case 'markdown':
      return (await loadMarkdown()).serializeIRToMarkdown(ir);
    case 'latex':
      return (await loadLatex()).serializeIRToLatex(ir);
    case 'docx':
      return (await loadDocx()).serializeIRToDocx(ir);
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
