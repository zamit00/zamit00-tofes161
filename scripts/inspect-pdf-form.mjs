import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const input = process.argv[2] || join(root, '161JasonFiles', 'tofes-161-1-2.pdf');

if (!existsSync(input)) {
  console.error('Missing:', input);
  process.exit(1);
}

const doc = await PDFDocument.load(readFileSync(input), { ignoreEncryption: true });
try {
  const form = doc.getForm();
  const fields = form.getFields();
  console.log('Fields:', fields.length);
  for (const f of fields) {
    const name = f.getName();
    const type = f.constructor?.name || typeof f;
    console.log('-', name, type);
  }
} catch (e) {
  console.log('No AcroForm or error:', e.message);
}
