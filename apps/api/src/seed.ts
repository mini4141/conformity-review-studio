import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REVIEWER, type FileMeta, type FileStatus, type Risk } from '@crs/shared';
import { repo, resetLocalTable } from './ddb/repo.js';
import { docs, pdfKey } from './docs/store.js';
import { analysePages, extractPages } from './doc-intel/pipeline.js';
import { getProvider } from './providers/index.js';
import { standard } from './standard.js';
import { log } from './log.js';

const SAMPLES = resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/samples');
const ANCHOR = Date.UTC(2026, 10, 28); // fixed demo date so seeds (and visual baselines) are stable
const day = (n: number) => new Date(ANCHOR + n * 864e5).toISOString().slice(0, 10);

const DEVICES = ['Infusion Pump', 'Syringe Driver', 'Patient Monitor', 'Ventilator', 'Defibrillator', 'Dialysis Console', 'Insulin Pen', 'Pulse Oximeter', 'Surgical Laser', 'Enteral Feeder', 'Warming Unit', 'Suction Unit'];
const MAKERS = ['Aquila Medical Systems', 'Northbeam Devices', 'Corvid Health', 'Meridian Biomedical', 'Halcyon Instruments', 'Tern Clinical'];
const PEOPLE = [REVIEWER, 'A. Okafor', 'M. Lindqvist', 'S. Tanaka', 'R. Duarte'];
const STATUSES: FileStatus[] = ['New', 'In review', 'In review', 'Awaiting info', 'Decision pending'];
const RISKS: Risk[] = ['low', 'medium', 'high', 'medium'];
const CLASSES = ['I', 'IIa', 'IIb', 'III'] as const;

function buildFiles(): FileMeta[] {
  const files: FileMeta[] = [
    { id: 'f01', title: 'Aquila IP-200 Infusion Pump, Technical File v3 (412 pages)', deviceClass: 'IIb', manufacturer: MAKERS[0]!, pages: 412, due: day(2), status: 'In review', risk: 'high', assignee: REVIEWER, aiCoverage: 0, hasDocument: true },
  ];
  for (let i = 2; i <= 25; i++) {
    const status = STATUSES[i % STATUSES.length]!;
    files.push({
      id: `f${String(i).padStart(2, '0')}`,
      title: `${MAKERS[i % MAKERS.length]!.split(' ')[0]} ${DEVICES[i % DEVICES.length]} ${['A', 'X', 'S', 'Pro'][i % 4]}-${100 + i * 7}, Technical File v${1 + (i % 4)}`,
      deviceClass: CLASSES[(i * 3) % 4]!,
      manufacturer: MAKERS[i % MAKERS.length]!,
      pages: 120 + ((i * 97) % 500),
      due: day(((i * 5) % 34) - 3),
      status,
      risk: RISKS[i % RISKS.length]!,
      assignee: PEOPLE[(i * 2) % PEOPLE.length]!,
      aiCoverage: status === 'New' ? 0 : 40 + ((i * 13) % 56),
      hasDocument: false,
    });
  }
  return files;
}

async function main() {
  if (process.env.DDB_ENDPOINT) await resetLocalTable();
  const files = buildFiles();
  const provider = getProvider();
  const bytes = new Uint8Array(await readFile(`${SAMPLES}/aquila-ip200-tech-file-v3.pdf`));
  const t = Date.now();
  const result = await analysePages('f01', standard.clauses, await extractPages(bytes), provider);
  files[0]!.aiCoverage = result.coverage;
  await docs.put(pdfKey('f01'), bytes);
  await repo.putFiles(files);
  await repo.putFindings(result.findings);
  const stats = 'stats' in provider ? provider.stats : undefined;
  log('info', 'seeded', { files: files.length, findings: result.findings.length, coverage: result.coverage, provider: provider.name, ms: Date.now() - t, stats });
  if (process.env.SEED_SAMPLE_OUT) {
    await mkdir(dirname(process.env.SEED_SAMPLE_OUT), { recursive: true });
    const sample = result.findings.filter((_, i) => i % 6 === 0).slice(0, 12);
    await writeFile(process.env.SEED_SAMPLE_OUT, JSON.stringify({ provider: provider.name, stats, coverage: result.coverage, sources: [...new Set(result.findings.map((f) => f.source.name))], sample }, null, 2));
  }
}

main().catch((e) => {
  log('error', 'seed failed', { error: String(e) });
  process.exit(1);
});
