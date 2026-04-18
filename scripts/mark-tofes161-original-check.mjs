/**
 * מצייר מספר (ברירת מחדל: 024019507) במרכז המיקום — משבצת "מקורי" / שורת "טופס זה:".
 *
 * שימוש:
 *   node scripts/mark-tofes161-original-check.mjs [קלט.pdf] [פלט.pdf]
 *
 * קואורדינטות PDF: רגל שמאלית תחתונה, Y עולה למעלה.
 * לירידה בדף (למטה) — הקטנת MARK_CY.
 *
 *   set MARK_CX=380
 *   set MARK_CY=698
 *   set MARK_NUMBER=024019507
 *   set MARK_FONT_SIZE=5.2
 *
 * ריווח: ערוך DEFAULT_MARK_* בקובץ (אחרי `root`), או בסביבה:
 *   set MARK_CHAR_SPACE=2.5
 *   set MARK_DIGIT_PITCH=9
 *
 * בדיקת מיקום — נקודה אדומה קטנה:
 *   set MARK_TEST=1
 *
 * מידע על הדף:
 *   node scripts/mark-tofes161-original-check.mjs --info path/to.pdf
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

/** רווח נוסף בין ספרות (נקודות PDF). משתנה הסביבה MARK_CHAR_SPACE דורס. */
const DEFAULT_MARK_CHAR_SPACE = 4.4;

/**
 * מרחק בין מרכז ספרה למרכז הבאה (משבצות קבועות).
 * 0 = כבוי. ערך חיובי = מצב pitch. MARK_DIGIT_PITCH בסביבה דורס.
 */
const DEFAULT_MARK_DIGIT_PITCH = 0;

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args[0] === '--info') {
    return { mode: 'info', input: args[1] || join(root, '161JasonFiles', 'tofes-161-1-2.pdf') };
  }
  const input =
    args[0] || join(root, '161JasonFiles', 'tofes-161-1-2.pdf');
  const output =
    args[1] ||
    input.replace(/\.pdf$/i, '') + '-marked.pdf';
  return { mode: 'mark', input, output };
}

function numEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function strEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') return fallback;
  return String(v);
}

/** רק אם המשתנה מוגדר ומספר חיובי */
function optionalPositiveNumEnv(name) {
  const v = process.env[name];
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return n;
}

const black = rgb(0, 0, 0);

/**
 * @param {import('pdf-lib').PDFPage} page
 * @param {import('pdf-lib').PDFFont} font
 * @param {number} digitPitch מרחק בין מרכזי תווים עוקבים (משבצות בטופס)
 * @param {number} charSpace רווח נוסף אחרי כל תו (לפני הרוחב הטבעי של הבא)
 */
function drawSpacedDigits(page, font, label, fontSize, cx, cy, charSpace, digitPitch) {
  const yText = cy - fontSize * 0.35;
  const chars = Array.from(label);
  const n = chars.length;

  if (digitPitch !== undefined) {
    for (let i = 0; i < n; i++) {
      const ch = chars[i];
      const cw = font.widthOfTextAtSize(ch, fontSize);
      const centerX = cx - ((n - 1) * digitPitch) / 2 + i * digitPitch;
      page.drawText(ch, {
        x: centerX - cw / 2,
        y: yText,
        size: fontSize,
        font,
        color: black,
      });
    }
    return;
  }

  if (charSpace > 0) {
    let total = 0;
    for (let i = 0; i < n; i++) {
      total += font.widthOfTextAtSize(chars[i], fontSize);
      if (i < n - 1) total += charSpace;
    }
    let x = cx - total / 2;
    for (let i = 0; i < n; i++) {
      const ch = chars[i];
      const cw = font.widthOfTextAtSize(ch, fontSize);
      page.drawText(ch, {
        x,
        y: yText,
        size: fontSize,
        font,
        color: black,
      });
      x += cw + (i < n - 1 ? charSpace : 0);
    }
    return;
  }

  const tw = font.widthOfTextAtSize(label, fontSize);
  page.drawText(label, {
    x: cx - tw / 2,
    y: yText,
    size: fontSize,
    font,
    color: black,
  });
}

async function main() {
  const { mode, input, output } = parseArgs(process.argv);

  if (!existsSync(input)) {
    console.error('קובץ לא נמצא:', input);
    process.exit(1);
  }

  const pdfBytes = readFileSync(input);
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  if (pages.length === 0) {
    console.error('אין עמודים בקובץ.');
    process.exit(1);
  }

  const page0 = doc.getPage(0);
  const { width, height } = page0.getSize();
  const rot = page0.getRotation().angle;

  if (mode === 'info') {
    console.log('קובץ:', input);
    console.log('עמודים:', pages.length);
    console.log('עמוד 1 — רוחב:', width, 'גובה:', height, 'סיבוב:', rot);
    return;
  }

  if (rot !== 0) {
    console.warn('אזהרה: סיבוב עמוד', rot, '— ייתכן שתידרש התאמת קואורדינטות.');
  }

  // שורת "טופס זה:" נמוכה מהכותרת — ~145–165pt מתחת לקצה העליון (A4 ~842)
  const defaultCx = Math.round(width * 0.8175);
  const defaultCy = 0.69*height;
  const cx = numEnv('MARK_CX', defaultCx);
  const cy = numEnv('MARK_CY', defaultCy);
  const label = strEnv('MARK_NUMBER', '024019507');
  const fontSize = numEnv('MARK_FONT_SIZE', 12);

  if (process.env.MARK_GLOW === '1') {
    page0.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 0.4, 0.8),
      opacity: 0.06,
    });
  }

  if (process.env.MARK_TEST === '1') {
    page0.drawCircle({
      x: cx,
      y: cy,
      size: 2.5,
      color: rgb(1, 0, 0),
      borderColor: rgb(0.5, 0, 0),
      borderWidth: 0.25,
    });
  }

  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const charSpace = numEnv('MARK_CHAR_SPACE', DEFAULT_MARK_CHAR_SPACE);
  const digitPitch =
    optionalPositiveNumEnv('MARK_DIGIT_PITCH') ??
    (DEFAULT_MARK_DIGIT_PITCH > 0 ? DEFAULT_MARK_DIGIT_PITCH : undefined);
  drawSpacedDigits(page0, font, label, fontSize, cx, cy, charSpace, digitPitch);

  const outBytes = await doc.save({ useObjectStreams: false });
  writeFileSync(output, outBytes);
  console.log('נשמר:', output);
  console.log(
    'טקסט:',
    label,
    'במרכז (',
    cx,
    ',',
    Number(cy.toFixed(2)),
    ') גודל',
    fontSize,
    digitPitch !== undefined
      ? `pitch=${digitPitch}`
      : charSpace > 0
        ? `charSpace=${charSpace}`
        : '',
  );
  console.log('כוון: MARK_CX, MARK_CY, MARK_NUMBER, MARK_FONT_SIZE, MARK_CHAR_SPACE, MARK_DIGIT_PITCH');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
