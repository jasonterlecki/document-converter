import type { ConversionRequest, ConversionResponse, Format } from '../workers/conversionWorker';

export type ConvertInput = {
  from: Format;
  to: Format;
  content: string | ArrayBuffer;
};

export type ConvertResult = {
  output: string | ArrayBuffer;
};

export class ConversionWorkerClient {
  private worker: Worker;
  private pending = new Map<string, (response: ConversionResponse) => void>();

  constructor() {
    this.worker = new Worker(new URL('../workers/conversionWorker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = (event: MessageEvent<ConversionResponse>) => {
      const handler = this.pending.get(event.data.id);
      if (handler) {
        handler(event.data);
        this.pending.delete(event.data.id);
      }
    };
  }

  async convert(input: ConvertInput): Promise<ConvertResult> {
    const id = crypto.randomUUID();
    const message: ConversionRequest = { id, ...input };

    return new Promise((resolve, reject) => {
      this.pending.set(id, (response) => {
        if (!response.ok || response.output === undefined) {
          reject(new Error(response.error ?? 'Conversion failed'));
          return;
        }
        resolve({ output: response.output });
      });

      if (input.content instanceof ArrayBuffer) {
        this.worker.postMessage(message, [input.content]);
      } else {
        this.worker.postMessage(message);
      }
    });
  }

  dispose() {
    this.pending.clear();
    this.worker.terminate();
  }
}
