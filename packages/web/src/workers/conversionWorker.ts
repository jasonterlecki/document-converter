import type { ConversionRequest, ConversionResponse, Format } from './types';

const loadMarkdown = async () => import('../../../core/src/markdown/index.ts');
const loadLatex = async () => import('../../../core/src/latex/index.ts');
const loadDocx = async () => import('../../../core/src/docx/index.ts');

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
    // eslint-disable-next-line no-console
    console.log('[docx] ir blocks', ir.blocks?.length ?? 0, 'first', ir.blocks?.[0]?.type);
    const output = await fromIR(to, ir);
    if (to === 'docx' && output instanceof ArrayBuffer) {
      const bytes = new Uint8Array(output);
      // Debug: log header and size to ensure we emitted a docx zip
      // eslint-disable-next-line no-console
      console.log('[docx] bytes', bytes.length, 'header', Array.from(bytes.slice(0, 4)));
      try {
        const parsed = await (await loadDocx()).parseDocxToIR(output);
        const preview = parsed.blocks[0]?.type === 'Paragraph' ? parsed.blocks[0].inlines[0]?.type : parsed.blocks[0]?.type;
        // eslint-disable-next-line no-console
        console.log('[docx] parsed blocks', parsed.blocks.length, 'first', preview);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log('[docx] parse check failed', error);
      }
    }
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
