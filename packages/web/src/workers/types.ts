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
