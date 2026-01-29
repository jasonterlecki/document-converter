import type { ConversionRequest, ConversionResponse, Format } from '../workers/types';

export type ConvertInput = {
  from: Format;
  to: Format;
  content: string | ArrayBuffer;
};

export type ConvertResult = {
  output: string | ArrayBuffer;
};

export class ConversionWorkerClient {
  private textWorker: Worker;
  private docxWorker: Worker;
  private pending = new Map<string, (response: ConversionResponse) => void>();

  constructor() {
    this.textWorker = new Worker(new URL('../workers/textConversionWorker.ts', import.meta.url), {
      type: 'module',
    });
    this.docxWorker = new Worker(new URL('../workers/conversionWorker.ts', import.meta.url), {
      type: 'module',
    });
    const handleMessage = (event: MessageEvent<ConversionResponse>) => {
      const handler = this.pending.get(event.data.id);
      if (handler) {
        handler(event.data);
        this.pending.delete(event.data.id);
      }
    };
    this.textWorker.onmessage = handleMessage;
    this.docxWorker.onmessage = handleMessage;
  }

  async convert(input: ConvertInput): Promise<ConvertResult> {
    const id = crypto.randomUUID();
    const message: ConversionRequest = { id, ...input };
    const worker = input.from === 'docx' || input.to === 'docx' ? this.docxWorker : this.textWorker;

    return new Promise((resolve, reject) => {
      this.pending.set(id, (response) => {
        if (!response.ok || response.output === undefined) {
          reject(new Error(response.error ?? 'Conversion failed'));
          return;
        }
        resolve({ output: response.output });
      });

      if (input.content instanceof ArrayBuffer) {
        worker.postMessage(message, [input.content]);
      } else {
        worker.postMessage(message);
      }
    });
  }

  dispose() {
    this.pending.clear();
    this.textWorker.terminate();
    this.docxWorker.terminate();
  }
}
