# PROGRESS

Resume point: see the first unchecked item. Current phase: **1 done locally; CI check, then 2 (AWS)**.

## Phases
- [x] Phase 0 scaffold
- [ ] Phase 1 local (features F1–F7, tests green, CI green, proof index)
- [ ] Phase 2 AWS showcase
- [ ] Phase 3 destroy + verify
- [ ] Phase 4 write-up (`docs/PORTFOLIO.md`)

## Coverage matrix (SPECS §2)
- [x] Thinks in finished interfaces: 3 screens to production finish (screenshots + visual baselines)
- [x] Own layout, typography, interaction, motion, design system and React (`packages/ui`, tokens, Motion, screens; Storybook + screenshots)
- [x] Reviewer sees a finding and corrects the model (FindingCard, correction flow, diff, history; e2e + screenshots)
- [x] Hundreds of dense fields readable (RequirementsMatrix virtualized, density, pinning; screenshot + perf log)
- [x] Taste you can defend (`docs/design/principles.md` + `decisions.md`)
- [x] Whole thing built: Zustand/TanStack Query, Hono API, DynamoDB
- [x] Density, expert users, complex workflows (keyboard-first, palette, split panes; e2e)
- [x] Review/correct AI output signal (findings UX + corrections captured)
- [x] Design system built and maintained (Storybook docs + a11y)
- [ ] Ship to production (CloudFront deployment; Phase 2 proof)

## Stack coverage (CLAUDE.md §2)
- [x] React 19 + TS, Vite, React Router
- [x] TanStack Query
- [x] Zustand
- [x] TanStack Table + Virtual
- [x] pdfjs-dist viewer (text layer + highlights)
- [x] cmdk palette
- [x] react-resizable-panels
- [x] Design tokens (light/dark/density), type scale, components (Button, IconButton, Badge, Tag, Tooltip, Popover, Kbd, Table, SplitPane, Tabs, Toast, EmptyState, ConfidenceMeter, DiffText)
- [x] Motion (reduced-motion respected)
- [x] Storybook 9 (autodocs, a11y, interaction tests)
- [x] axe-core
- [x] Playwright e2e + visual snapshots
- [x] Vitest + RTL
- [x] Lighthouse CI
- [x] Hono API (local + Lambda adapter)
- [ ] unpdf/pdfjs extraction, clause segmentation, rules provider, Bedrock provider
- [x] DynamoDB single table (+ DynamoDB Local)
- [x] pdf-lib sample generator
- [ ] AWS CDK v2 (S3, CloudFront, API GW, Lambda, DynamoDB, S3 docs, Bedrock)
- [ ] GitHub Actions CI

## Phase 1 checklist (SPECS §9)
- [x] `tests/`: Vitest, Storybook test-runner, Playwright (+ visual), Lighthouse reports
- [x] screenshots 01-queue, 02-workspace, 03-evidence-highlight, 04-finding-correction-diff, 05-matrix-compact, 06-matrix-comfortable, 07-command-palette, 08-decision, 09-dark-workspace, 10-storybook-tokens, 11-storybook-findingcard
- [x] `logs/perf-matrix-scroll.json`, `logs/axe-summary.json`, `docs/design/*.md`

## Phase 2 checklist (SPECS §10)
- [ ] screenshots 01-cf-workspace, 02-cf-bedrock-findings, 03-cf-storybook
- [ ] `logs/bedrock-findings-sample.json`, `logs/cdk-deploy.log`, `resources.txt`
- [ ] `tests/playwright-cloud/`

## Phase 3 checklist (SPECS §11)
- [ ] `cdk destroy --all --force`, toolkit stack + bucket deleted
- [ ] `verify-destroyed.sh`: no CloudFront, API Gateway, Lambda, DynamoDB, S3 left
- [ ] `proof/phase3-destroy/verify-destroyed.txt`

## Definition of done (CLAUDE.md §12)
- [ ] All stack items used in running code
- [ ] Phase 1 proof complete, tests green locally and in CI
- [ ] Phase 2 proof complete
- [ ] Phase 3 everything destroyed
- [ ] `docs/PORTFOLIO.md`, `README.md` written; committed and pushed
