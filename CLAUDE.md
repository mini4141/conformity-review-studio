# CLAUDE.md — conformity-review-studio

These are the engineering rules for Claude Code on this repository. You work **fully autonomously**. Don't stop to ask the user questions. When something is ambiguous, pick the simplest option that keeps every stack item in §2 covered. Record it in `docs/DECISIONS.md` (one line: date, decision, reason) and keep going. Read `SPECS.md` end to end before writing any code. It is the source of truth for features, architecture and proof.

## 1. Project at a glance

| | |
|---|---|
| Project | Conformity Review Studio: a dense, AI-assisted technical-file review interface for certification bodies |
| Repo | public GitHub repo `conformity-review-studio`. `origin` is already configured and the default branch is `main` |
| Target role | Front End Design Engineer (React, design systems, dense expert UIs, AI-review interfaces) |
| Pitch | A reviewer at a notified body checks a 400-page technical file against a standard. This interface puts the clause checklist, the document and the AI's findings side by side. Every finding links to highlighted evidence, corrections take one keystroke, and hundreds of fields stay readable. It's a designed and engineered product, not a mockup. |
| Priority | **Breadth of the tech stack beats depth of business logic.** Every technology in §2 must appear in running code and be visible in the proof. Full validation, edge cases and complete domain rules are out of scope. |

## 2. Mandatory tech stack

| Area | Technology |
|---|---|
| Frontend | **React 19 + TypeScript**, Vite, React Router, **TanStack Query** (server state), **Zustand** (UI state), **TanStack Table + TanStack Virtual** (dense, virtualized grids), **pdfjs-dist** (PDF.js viewer with text layer + highlight overlays), `cmdk` command palette, `react-resizable-panels` |
| Design system | `packages/ui`: design tokens (CSS custom properties, light/dark, density modes), a type scale built for density (Inter or IBM Plex Sans + tabular numerals), spacing scale, and components: Button, IconButton, Badge, Tag, Tooltip, Popover, Kbd, Table, SplitPane, Tabs, Toast, EmptyState, ConfidenceMeter, DiffText |
| Motion | **Motion** (framer-motion) for meaningful micro-interactions (finding accept/reject, panel transitions, highlight pulse); `prefers-reduced-motion` respected |
| Docs / QA | **Storybook 9** (autodocs, a11y addon, interaction tests), **axe-core**, Playwright (e2e + visual snapshots), Vitest + React Testing Library, Lighthouse CI |
| Backend (thin) | Node 24 + TypeScript **Hono** API (local server + AWS Lambda adapter), document intelligence: PDF text extraction (`unpdf`/pdfjs in Node), clause segmentation, finding generation via **Amazon Bedrock** (Claude, structured JSON output) with a deterministic rules engine fallback |
| Data | **DynamoDB** (DynamoDB Local in Phase 1) single-table: files, clauses, findings, corrections, decisions; documents in S3 (local folder in Phase 1) |
| Sample data | Generator script (`pdf-lib`) producing a synthetic 400-page technical file for a fictional infusion pump against a fictional standard "TS-60601-SIM" (original text, no copyrighted standards) |
| AWS | S3 + CloudFront (SPA + Storybook at `/storybook/`), API Gateway HTTP API + Lambda (Hono), DynamoDB, S3 documents bucket, Bedrock |
| IaC / CI | **AWS CDK v2 (TypeScript)** · GitHub Actions (typecheck, lint, Vitest, Storybook build + test-runner, Playwright, Lighthouse CI) |

Don't swap an item for an alternative. If a library is unavailable or broken, use the closest equivalent and log the swap in `docs/DECISIONS.md`.

## 3. Environment

- The host is a **Windows 11 PC**. Claude Code's shell is Git Bash, and the container runtime is Docker Desktop (WSL2 backend). Write automation as POSIX `bash` scripts under `scripts/` and use forward-slash paths. Add a `.gitattributes` with `* text=auto eol=lf` so scripts keep LF line endings.
- Prerequisites: Node.js 24 LTS + pnpm, Docker Desktop (DynamoDB Local), AWS CLI v2, AWS CDK CLI. If one is missing, install it with `winget` or the official installer and record the version in `docs/DECISIONS.md`.
- The `gh` CLI is logged in to the owner's GitHub account, and AWS CLI v2 is installed.
- Don't use Bitnami charts or images (their free catalogue has been retired). Use official upstream images and charts.

## 4. AWS account rules

- Profile: **`conformity-review-studio-deployer`**. Always pass it explicitly, either as `--profile conformity-review-studio-deployer` or by exporting `AWS_PROFILE=conformity-review-studio-deployer` inside the scripts. Never use the default profile or any other profile.
- Region: **`ap-southeast-2`** for everything except global services such as CloudFront and IAM.
- The profile has `PowerUserAccess` + `IAMFullAccess`. Start Phase 2 with `aws sts get-caller-identity --profile conformity-review-studio-deployer`. If that fails, stop and write the reason at the top of `PROGRESS.md`.
- Use AWS only. Where a requirement names Azure, GCP or another hyperscaler, use the AWS equivalent stated in `SPECS.md`.
- IaC: AWS CDK v2 (TypeScript). Bootstrap with qualifier `crstudio` and toolkit stack `CDKToolkit-conformity-review-studio`, and delete both in Phase 3. Don't create resources by hand in the console: every cloud resource comes from code in `infra/`. Keep IaC state local and gitignored.
- Tag every resource with `Project=conformity-review-studio`, `Ephemeral=true`, `ManagedBy=<tool>` and `Owner=alvieirvansyah`.
- Deployment runs **from this PC via scripts** (`scripts/deploy.sh`, `scripts/destroy.sh`). GitHub Actions only builds and tests, and never holds AWS credentials.

## 5. Phases and gates

Work strictly in order. A phase is done only when its proof exists (§8) and its items are ticked in `PROGRESS.md`. Commit and push at the end of every phase.

1. **Phase 0, scaffold.** Set up the repo layout from `SPECS.md` §4. Create `README.md`, `PROGRESS.md` (copy every checklist item from `SPECS.md` §2 and §9–§11 into it), `docs/DECISIONS.md`, `.gitignore`, `.gitattributes`, `.env.example` and the CI workflow.
2. **Phase 1, local.** Build every feature in `SPECS.md` §5. Everything runs on this PC with Docker and local tooling, and makes **no AWS calls**: use the local stand-ins listed in `SPECS.md`. Run the full test suite, then capture proof into `proof/phase1-local/`. Phase 1 counts as "ready for next" only when `scripts/test-all.sh` is green, the CI run on `main` is green, and the proof index is complete.
3. **Phase 2, AWS showcase.** Deploy with `scripts/deploy.sh`, run the smoke/e2e tests against the cloud endpoints and capture proof into `proof/phase2-cloud/`. Keep the stack alive only as long as capturing takes, with a target of **under 2 hours**.
4. **Phase 3, destroy.** Right after capturing, run `scripts/destroy.sh` and then `scripts/verify-destroyed.sh`, and save the output to `proof/phase3-destroy/`. This phase is **mandatory even if Phase 2 partly failed**. Never end a session with cloud resources running.
5. **Phase 4, write-up.** Write `docs/PORTFOLIO.md`. It needs the problem, an architecture diagram (Mermaid), a stack → requirement table, the key screenshots (relative links into `proof/`), what was hard, the approximate AWS cost and how to reproduce. This file becomes a technical page on alvieirvansyah.com.

## 6. Engineering rules

- Keep it simple and conventional: idiomatic layout for each language, small modules, no premature abstraction, no dead code.
- Configure through environment variables, with a committed `.env.example`. Real `.env` files are gitignored.
- **Never commit secrets.** That includes credentials, IaC state, `.terraform/`, `cdk.out/`, kubeconfigs, private keys and certificates. Generate local dev keys and certs into a gitignored `.local/` folder.
- Every HTTP service exposes a health endpoint (`/healthz` or the framework idiom) and logs structured JSON to stdout.
- Pin versions: commit lockfiles and pin container images to at least a minor tag.
- Use one command for each job:
  - `scripts/dev-up.sh` starts everything locally and `scripts/dev-down.sh` stops it.
  - `scripts/seed.sh` loads demo data. Start-up may run it automatically so that demos never start empty.
  - `scripts/test-all.sh` runs every test layer.
  - `scripts/capture-proof.sh <phase>` captures the proof for a phase.
- Keep `README.md` current. It covers what the project is, the architecture diagram, a quickstart, deploy/destroy, a link to `proof/README.md` and `docs/PORTFOLIO.md`, and the CI badge.
- Don't put the hiring company's name anywhere in the repo. Describe the target role generically.
- `docs/AI_USAGE.md`: briefly note how AI coding tools were used and how their output was reviewed and tested.

## 7. Testing rules

- Tests are **shallow by design**: one happy-path test per feature or flow is enough. Don't write exhaustive validation or edge-case tests.
- Required layers: Vitest + RTL (one per key component: FindingCard accept/correct, RequirementsGrid inline edit, ClauseList filter), Storybook interaction tests + a11y (zero serious axe violations), Playwright e2e (open file → select clause → jump to evidence → correct a finding → record decision), Playwright visual snapshots for 4 key screens (light + dark), Lighthouse CI (performance ≥ 85, accessibility ≥ 95).
- `scripts/test-all.sh` runs every local layer and exits non-zero on failure. CI runs every layer that doesn't need the cloud.
- Save test output as files (JUnit XML, an HTML report or a plain log) under the current phase's `proof/.../tests/`.

## 8. Proof rules

Proof is the deliverable. Use this folder layout:

```
proof/
  README.md                 # index: each artifact on one line, with what it proves
  phase1-local/
    screenshots/            # PNG, named NN-what-it-shows.png
    logs/                   # captured service logs and CLI output
    tests/                  # test reports
  phase2-cloud/
    screenshots/  logs/  tests/
    resources.txt           # deployed AWS resources (from IaC outputs / describe calls)
  phase3-destroy/
    verify-destroyed.txt
```

- Capture screenshots with a script (`scripts/capture-proof.sh`, driving Playwright headless), never by hand, so they can be reproduced. The screenshots listed in `SPECS.md` are the minimum.
- There is no AWS console login, so render AWS-side visuals from the CLI. For example, `aws cloudwatch get-metric-widget-image` renders a metrics graph as a PNG. Otherwise save CLI `describe`/`get` output as logs.
- Before saving logs or CLI output, redact 12-digit AWS account IDs (`sed -E 's/[0-9]{12}/<ACCOUNT_ID>/g'`), access keys, tokens, passwords and the deployer's public IP.
- Proof must show the system **working**, with real data flowing through it, and not just "deployed".

## 9. Cost and safety guardrails (AWS)

- Use the smallest viable sizes: Lambda 1024 MB (PDF parsing), DynamoDB on-demand, CloudFront PriceClass_100, Bedrock calls capped (findings for one file are generated once and cached).
- **No NAT gateways.** Also no multi-AZ databases, provisioned IOPS, reserved capacity or Savings Plans, Route 53 domains, or Marketplace subscriptions.
- Databases: `deletion_protection = false`, skip the final snapshot and keep backup retention minimal. S3 buckets are force-destroyable and ECR repos force-deletable. CloudWatch log groups get 1-day retention and are created by IaC, so they get destroyed with it.
- Public app endpoints are fine for the showcase. Keep databases private: their security groups admit only the app tier. Don't open SSH or database ports to `0.0.0.0/0` and don't use SSH at all. Use SSM if you need a shell.
- Don't send real emails or SMS, and don't call paid third-party APIs. Anything external is mocked unless `SPECS.md` says otherwise.
- `scripts/destroy.sh` must be idempotent and safe to re-run. It first deletes anything that would block the IaC destroy: empty the S3 buckets, then `cdk destroy --all --force`, then delete `CDKToolkit-conformity-review-studio` and its staging bucket.
- `scripts/verify-destroyed.sh` lists anything still tagged `Project=conformity-review-studio` (`aws resourcegroupstaggingapi get-resources`) and runs the specific checks in `SPECS.md` §11. It exits non-zero if anything billable remains. The tagging API can show resources for a few minutes after deletion, so confirm each hit with a direct describe call before failing.

## 10. Git and CI

- Use Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `infra:`, `chore:`). Commit small and often, and push to `origin main` at least at the end of every phase.
- `.github/workflows/ci.yml` runs build, lint and the cloud-free tests on every push and pull request. Keep it green.
- Never force-push `main`. Never commit build output, dependency folders (`node_modules`, `target`, `bin`, `obj`, `.venv`) or state files.

## 11. Project-specific rules

- **Taste is the requirement.** Before building screens, write `docs/design/principles.md` (density, hierarchy, typography, colour for meaning only, motion with purpose) and `docs/design/decisions.md` (why this layout, why these type sizes, why keyboard-first). Defend each choice in one or two sentences.
- Finished interfaces, not components in isolation: every component lives in Storybook **and** is used in a real screen. Build the three main screens to a production finish: Review Queue, Review Workspace and Requirements Matrix.
- Density done right: a compact/comfortable density toggle (tokens switch row height, padding and font size), tabular numerals for numbers, truncation with tooltips, sticky headers, and column pinning. Hundreds of fields on one screen must stay readable and stay at 60 fps when scrolling (virtualized).
- Keyboard-first: `j`/`k` next/previous finding, `a` accept, `r` reject, `e` edit, `g c` go to clause, `⌘K` command palette, `?` shortcut sheet. Every shortcut has a visible affordance.
- AI trust UX: each finding shows confidence (ConfidenceMeter), evidence quote + page link, the rule or model that produced it, and the reviewer's override history. Corrections capture the reason and the corrected value; the model's original is kept (diff view).
- LLM provider interface with `bedrock` and `rules` implementations. CI and Phase 1 use `rules` (deterministic). Phase 2 runs `bedrock` for the sample file; if model access isn't enabled, fall back to `rules` and log it.
- Visual QA: commit the Playwright visual baselines for the 4 key screens in light and dark. Any intentional visual change updates the baselines in the same commit.

## 12. Definition of done

- [ ] Every stack item in §2 is used in running code. Cross-check with the coverage matrix in `SPECS.md` §2 and tick each row in `PROGRESS.md`.
- [ ] Phase 1 proof is complete, and all tests are green locally and in CI.
- [ ] Phase 2 proof is complete: cloud screenshots, a cloud test run and the resource list.
- [ ] Phase 3: everything is destroyed and `verify-destroyed.txt` shows nothing billable left.
- [ ] `docs/PORTFOLIO.md` and `README.md` are written, and everything is committed and pushed.
