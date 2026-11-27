# Proof index

Every artifact is produced by a script from the running system. Nothing here is edited by hand.

## Phase 1: local (`scripts/test-all.sh`, `scripts/capture-proof.sh phase1`)

### Screenshots (`phase1-local/screenshots/`)
| File | Proves |
|---|---|
| `01-queue.png` | Review queue: 25 seeded files, saved views, relative + absolute due dates, risk, AI coverage |
| `02-workspace.png` | Three-pane workspace: clause checklist, PDF viewer, findings panel |
| `03-evidence-highlight.png` | Selecting clause 8.4.2 jumps the PDF to p. 233 with the evidence passage highlighted |
| `04-finding-correction-diff.png` | A corrected finding: diff of the AI's original vs the reviewer's value, reason and override history |
| `05-matrix-compact.png` | Requirements matrix in compact density: 180 rows, pinned first column, sticky header |
| `06-matrix-comfortable.png` | The same matrix in comfortable density |
| `07-command-palette.png` | Command palette (cmdk) searching clauses |
| `08-decision.png` | Conformity decision panel: summary by verdict, unresolved items, signed-off decision, export |
| `09-dark-workspace.png` | Dark theme workspace |
| `10-storybook-tokens.png` | Storybook: design tokens (colour, type scale, spacing, density, motion) |
| `11-storybook-findingcard.png` | Storybook: FindingCard with diff and history, with controls and a11y panel |

### Tests (`phase1-local/tests/`)
| File | Proves |
|---|---|
| `typecheck-lint.log` | Strict TypeScript across all packages and ESLint pass |
| `vitest-api.xml`, `vitest-web.xml` | Vitest + React Testing Library: doc-intel (>= 80% clause coverage, 8.4.2 on p. 233), FindingCard accept/correct, ClauseList filter, RequirementsGrid inline edit |
| `storybook-test-runner.log`, `storybook-junit.xml` | Storybook interaction tests for all 15 story files (36 stories), each checked with axe-core |
| `playwright-junit.xml`, `playwright-report/`, `playwright.log` | Playwright: smoke, 8 visual baselines (4 screens, light + dark), the full review journey, keyboard affordances, scroll performance, axe on 8 screen/theme combinations |
| `lighthouse/` , `lighthouse.log` | Lighthouse CI on the production build: performance and accessibility thresholds (>= 85 and >= 95) |

### Logs (`phase1-local/logs/`)
| File | Proves |
|---|---|
| `perf-matrix-scroll.json` | Matrix scrolling: three 2.5 s runs, median average above 55 fps, worst frame time per run |
| `axe-summary.json` | axe-core: 36 stories + 8 app screens, zero serious or critical violations |
| `seed.log`, `api.log`, `web.log` | Seeding (161 findings for 180 clauses, 89% coverage) and structured JSON service logs |

## Phase 2: cloud (`phase2-cloud/`)
See the phase 2 section once deployed: `resources.txt`, `logs/cdk-deploy.log`, `logs/bedrock-findings-sample.json`, `screenshots/`, `tests/playwright-cloud/`.

## Phase 3: destroy (`phase3-destroy/verify-destroyed.txt`)
Output of `scripts/verify-destroyed.sh` after `scripts/destroy.sh`.
