import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildStandard } from './standard.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../../../data/samples');
const TOTAL_PAGES = 412;
const W = 595;
const H = 842;
const M = 50;

// Deterministic PRNG so the sample file is reproducible.
let seed = 20261128;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;

const FILLER = [
  'This record is controlled under the manufacturer document management procedure.',
  'Supplier audits were performed according to the annual audit schedule.',
  'The manufacturing process was validated at three consecutive production lots.',
  'Revision history is maintained in the configuration management repository.',
  'Calibration certificates for all measuring equipment are on file and in date.',
  'Raw data sheets are archived and available for inspection on request.',
  'Deviations from the approved protocol were assessed and found not to affect conclusions.',
  'The test laboratory operated under its documented quality system throughout.',
  'Sample selection followed the approved sampling plan for production units.',
  'Environmental conditions during testing were recorded at the start and end of each session.',
  'All reviewers signed the records in accordance with the approval matrix.',
  'Traceability between specification items and test records is shown in the matrix appendix.',
];

const std = buildStandard();
type Outcome = 'pass' | 'obs' | 'fail' | 'none';
const OUTCOMES: Outcome[] = ['pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'obs', 'obs', 'fail', 'none'];
const addressed = (i: number) => i % 9 !== 4;

function evidenceLine(i: number, id: string, title: string): string {
  if (id === '8.4.2') return 'Test report TR-118: patient leakage 42 uA normal / 98 uA single fault, limit 100 uA. Result: PASS.';
  const tr = 100 + (i % 90);
  const t = title.toLowerCase();
  const v = OUTCOMES[i % 10]!;
  if (v === 'pass') return `Test report TR-${tr}: ${t} within stated limits in all units. Result: PASS.`;
  if (v === 'obs') return `Test report TR-${tr}: ${t} met in 2 of 3 configurations. Result: PASS WITH OBSERVATIONS.`;
  if (v === 'fail') return `Test report TR-${tr}: ${t} exceeded the limit in worst case. Result: FAIL.`;
  return `Test report TR-${tr}: ${t} retest pending, data not yet available. Result: NOT TESTED.`;
}

// Spread evidence pages over the file, anchoring clause 8.4.2 (index 70) on page 233.
const pageFor = (i: number) => (i <= 70 ? Math.round(12 + (i * 221) / 70) : Math.round(233 + ((i - 70) * 165) / 109));

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const next = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > max) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'ts-60601-sim.json'), JSON.stringify(std) + '\n');

  const plan = new Map<number, number>(); // page -> clause index
  let prev = 6;
  std.clauses.forEach((_, i) => {
    if (!addressed(i)) return;
    const p = Math.max(pageFor(i), prev + 1);
    plan.set(p, i);
    prev = p;
  });

  const pdf = await PDFDocument.create();
  pdf.setTitle('Aquila IP-200 Infusion Pump, Technical File v3 (synthetic)');
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.1, 0.1, 0.12);
  const grey = rgb(0.45, 0.45, 0.5);

  for (let n = 1; n <= TOTAL_PAGES; n++) {
    const page = pdf.addPage([W, H]);
    let y = H - 70;
    const line = (t: string, f = font, s = 10, c = ink, gap = 15) => {
      page.drawText(t, { x: M, y, size: s, font: f, color: c });
      y -= gap;
    };
    const para = (t: string) => wrap(t, font, 10, W - 2 * M).forEach((l) => line(l));
    const ci = plan.get(n);
    if (n === 1) {
      y = H - 250;
      line('Aquila IP-200 Infusion Pump', bold, 26, ink, 40);
      line('Technical File v3', font, 18, ink, 30);
      line('Aquila Medical Systems (fictional) | Synthetic document for software demonstration only', font, 10, grey, 20);
      line(`Assessed against ${std.id}`, font, 10, grey);
    } else if (ci !== undefined) {
      const c = std.clauses[ci]!;
      line(`Clause ${c.id} - ${c.title}`, bold, 15, ink, 24);
      line(`Section ${c.section}: ${c.sectionTitle} | ${c.group}`, font, 9, grey, 22);
      para(c.text);
      y -= 6;
      para(pick(FILLER));
      para(pick(FILLER));
      y -= 10;
      line('Evidence summary', bold, 11, ink, 18);
      const q = evidenceLine(ci, c.id, c.title);
      let size = 9;
      while (font.widthOfTextAtSize(q, size) > W - 2 * M && size > 6) size -= 0.5;
      line(q, font, size, ink, 20);
      para(pick(FILLER));
    } else if (n <= 6) {
      line(['Document control', 'Table of contents', 'Device description', 'Intended use', 'Regulatory summary'][n - 2] ?? 'Summary', bold, 15, ink, 26);
      for (let k = 0; k < 8; k++) para(pick(FILLER));
    } else {
      line(`Supporting documentation, part ${n}`, bold, 13, ink, 24);
      for (let k = 0; k < 9; k++) para(pick(FILLER));
    }
    page.drawText(`Aquila IP-200 | Technical File v3 | Page ${n} of ${TOTAL_PAGES}`, { x: M, y: 30, size: 8, font, color: grey });
  }
  const bytes = await pdf.save();
  writeFileSync(join(OUT, 'aquila-ip200-tech-file-v3.pdf'), bytes);
  const p842 = [...plan].find(([, i]) => std.clauses[i]!.id === '8.4.2')?.[0];
  console.log(JSON.stringify({ level: 'info', msg: 'sample generated', pages: TOTAL_PAGES, clauses: std.clauses.length, addressed: plan.size, bytes: bytes.length, page842: p842 }));
}
main();
