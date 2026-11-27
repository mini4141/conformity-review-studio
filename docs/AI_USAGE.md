# AI usage

This project was built with Claude Code acting as an autonomous engineer, following the rules in `CLAUDE.md` and the requirements in `SPECS.md`.

## What the AI did
- Wrote the code, tests, scripts, infrastructure and documentation in this repository, in the phase order defined in `CLAUDE.md`.
- Made small decisions on its own and logged each one in `docs/DECISIONS.md`.

## How the output was reviewed and tested
- **Types and lint:** strict TypeScript across all packages and ESLint (React hooks rules) must pass.
- **Tests at every layer:** Vitest + React Testing Library for key components, Storybook interaction tests with axe, Playwright end-to-end and visual baselines, a scroll-performance measurement, and Lighthouse CI thresholds (see `proof/`).
- **Real runs, not just green ticks:** screenshots and logs in `proof/` are produced by scripts from the running system with real data flowing through it, and the UI was exercised in a browser while building (this caught, for example, a Chromium behaviour where `scrollIntoView` returns a promise and breaks `useEffect` cleanup).
- **Cloud work is reproducible and torn down:** every AWS resource comes from CDK code, is tagged, and is destroyed by script and verified afterwards.

## Limits
- The standard and the technical file are synthetic and original text; domain rules are intentionally shallow (breadth of stack over depth of regulatory logic).
- Model-generated findings are always shown with evidence and are never auto-accepted.
