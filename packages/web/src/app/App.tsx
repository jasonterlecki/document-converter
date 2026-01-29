import { useEffect, useMemo, useState } from 'react';
import { ConversionWorkerClient } from '../adapters/conversionWorker';
import type { Format } from '../workers/conversionWorker';
import { samples } from './samples';

const formatOptions: Format[] = ['markdown', 'latex', 'docx'];

export function App() {
  const worker = useMemo(() => new ConversionWorkerClient(), []);
  const [fromFormat, setFromFormat] = useState<Format>('markdown');
  const [toFormat, setToFormat] = useState<Format>('latex');
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [inputBuffer, setInputBuffer] = useState<ArrayBuffer | null>(null);
  const [outputText, setOutputText] = useState('');
  const [outputBuffer, setOutputBuffer] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedSample, setSelectedSample] = useState('');
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  useEffect(() => () => worker.dispose(), [worker]);

  const handleConvert = async () => {
    setError(null);
    setIsConverting(true);
    setOutputText('');
    setOutputBuffer(null);

    try {
      let content: string | ArrayBuffer;
      if (fromFormat === 'docx') {
        if (!inputFile && !inputBuffer) {
          throw new Error('Select a .docx file to convert.');
        }
        content = inputFile ? await inputFile.arrayBuffer() : (inputBuffer as ArrayBuffer);
      } else {
        content = inputText;
      }

      const result = await worker.convert({ from: fromFormat, to: toFormat, content });
      if (typeof result.output === 'string') {
        setOutputText(result.output);
      } else {
        setOutputBuffer(result.output);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (toFormat === 'docx') {
      if (!outputBuffer) {
        return;
      }
      const blob = new Blob([outputBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      triggerDownload(blob, 'docmorph-output.docx');
      return;
    }

    if (!outputText) {
      return;
    }
    const extension = toFormat === 'latex' ? 'tex' : 'md';
    const mimeType = toFormat === 'latex' ? 'application/x-tex' : 'text/markdown';
    const blob = new Blob([outputText], { type: `${mimeType};charset=utf-8` });
    triggerDownload(blob, `docmorph-output.${extension}`);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSampleLoad = async () => {
    const sample = samples.find((item) => item.id === selectedSample);
    if (!sample) {
      return;
    }
    setIsLoadingSample(true);
    setFromFormat(sample.from);
    setToFormat(sample.to);
    setOutputText('');
    setOutputBuffer(null);
    setError(null);

    if (sample.contentType === 'docx') {
      setInputFile(null);
      setInputText('');
      try {
        const url = (sample.content as { url: string }).url;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to load docx fixture.');
        }
        const buffer = await response.arrayBuffer();
        setInputBuffer(buffer);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoadingSample(false);
      }
    } else {
      setInputBuffer(null);
      setInputFile(null);
      setInputText(sample.content as string);
      setIsLoadingSample(false);
    }
  };

  return (
    <main className="app">
      <header>
        <h1>DocMorph Web</h1>
        <p>Convert Markdown, LaTeX, and Word documents in the browser.</p>
      </header>
      <section className="controls">
        <label>
          Sample
          <div className="sample-row">
            <select value={selectedSample} onChange={(event) => setSelectedSample(event.target.value)}>
              <option value="">Select a sample</option>
              {samples.map((sample) => (
                <option key={sample.id} value={sample.id}>
                  {sample.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleSampleLoad} disabled={!selectedSample || isLoadingSample}>
              {isLoadingSample ? 'Loading…' : 'Load'}
            </button>
          </div>
        </label>
        <label>
          From
          <select value={fromFormat} onChange={(event) => setFromFormat(event.target.value as Format)}>
            {formatOptions.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select value={toFormat} onChange={(event) => setToFormat(event.target.value as Format)}>
            {formatOptions.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleConvert} disabled={isConverting}>
          {isConverting ? 'Converting…' : 'Convert'}
        </button>
      </section>
      <section className="panes">
        <div className="pane">
          <h2>Input</h2>
          {fromFormat === 'docx' ? (
            <input
              type="file"
              accept=".docx"
              onChange={(event) => {
                setInputFile(event.target.files?.[0] ?? null);
                setInputBuffer(null);
              }}
            />
          ) : (
            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Paste or type input here"
            />
          )}
        </div>
        <div className="pane">
          <h2>Output</h2>
          <div className="download">
            {toFormat === 'docx' ? (
              <p>Generate a .docx file from the conversion.</p>
            ) : (
              <p>Download the converted {toFormat} file.</p>
            )}
            <button
              type="button"
              onClick={handleDownload}
              disabled={toFormat === 'docx' ? !outputBuffer : !outputText}
            >
              Download {toFormat === 'docx' ? '.docx' : `.${toFormat === 'latex' ? 'tex' : 'md'}`}
            </button>
          </div>
        </div>
      </section>
      {error ? (
        <section className="error">
          <h3>Conversion error</h3>
          <p>{error}</p>
          <p>Check that the input and format selection match the content.</p>
        </section>
      ) : null}
    </main>
  );
}
