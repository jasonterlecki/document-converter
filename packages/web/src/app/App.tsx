import { useMemo, useState } from 'react';
import { ConversionWorkerClient } from '../adapters/conversionWorker';
import type { Format } from '../workers/conversionWorker';

const formatOptions: Format[] = ['markdown', 'latex', 'docx'];

export function App() {
  const worker = useMemo(() => new ConversionWorkerClient(), []);
  const [fromFormat, setFromFormat] = useState<Format>('markdown');
  const [toFormat, setToFormat] = useState<Format>('latex');
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState<File | null>(null);
  const [outputText, setOutputText] = useState('');
  const [outputBuffer, setOutputBuffer] = useState<ArrayBuffer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleConvert = async () => {
    setError(null);
    setIsConverting(true);
    setOutputText('');
    setOutputBuffer(null);

    try {
      let content: string | ArrayBuffer;
      if (fromFormat === 'docx') {
        if (!inputFile) {
          throw new Error('Select a .docx file to convert.');
        }
        content = await inputFile.arrayBuffer();
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

  return (
    <main className="app">
      <header>
        <h1>DocMorph Web</h1>
        <p>Convert Markdown, LaTeX, and Word documents in the browser.</p>
      </header>
      <section className="controls">
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
              onChange={(event) => setInputFile(event.target.files?.[0] ?? null)}
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
      {error ? <section className="error">{error}</section> : null}
    </main>
  );
}
