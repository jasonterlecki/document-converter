import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
} from 'docx';

const fixturesDir = resolve('packages/core/test/fixtures/docx');
mkdirSync(fixturesDir, { recursive: true });

const basicDoc = new Document({
  sections: [
    {
      children: [
        new Paragraph({ text: 'Sample Document', heading: HeadingLevel.HEADING_1 }),
        new Paragraph({
          children: [
            new TextRun('This is a '),
            new TextRun({ text: 'bold', bold: true }),
            new TextRun(' and '),
            new TextRun({ text: 'italic', italics: true }),
            new TextRun(' paragraph.'),
          ],
        }),
        new Paragraph({ text: 'First item', bullet: { level: 0 } }),
        new Paragraph({ text: 'Second item', bullet: { level: 0 } }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Name')] }),
                new TableCell({ children: [new Paragraph('Value')] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('Alpha')] }),
                new TableCell({ children: [new Paragraph('Beta')] }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

const edgeDoc = new Document({
  sections: [
    {
      children: [
        new Paragraph({ text: 'Special Characters', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: '# $ % & ~ _ ^ \\ { }' }),
        new Paragraph({
          children: [new TextRun({ text: 'Inline code', font: 'Courier New' })],
        }),
      ],
    },
  ],
});

const writeDoc = async (doc, filename) => {
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(resolve(fixturesDir, filename), buffer);
};

await writeDoc(basicDoc, 'basic.docx');
await writeDoc(edgeDoc, 'edge.docx');
