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
    if (!outputBuffer) {
      return;
    }
    const blob = new Blob([outputBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'docmorph-output.docx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSampleLoad = () => {
    const sample = samples.find((item) => item.id === selectedSample);
    if (!sample) {
      return;
    }
    setFromFormat(sample.from);
    setToFormat(sample.to);
    setOutputText('');
    setOutputBuffer(null);
    setError(null);

    if (sample.contentType === 'docx') {
      setInputFile(null);
      setInputText('');
      setInputBuffer(base64ToArrayBuffer(sample.content));
    } else {
      setInputBuffer(null);
      setInputFile(null);
      setInputText(sample.content);
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
            <button type="button" onClick={handleSampleLoad} disabled={!selectedSample}>
              Load
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
          {toFormat === 'docx' ? (
            <div className="download">
              <p>Generate a .docx file from the conversion.</p>
              <button type="button" onClick={handleDownload} disabled={!outputBuffer}>
                Download .docx
              </button>
            </div>
          ) : (
            <textarea value={outputText} readOnly placeholder="Converted output" />
          )}
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

const base64ToArrayBuffer = (base64: string) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};
