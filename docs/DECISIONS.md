# Decisions

One line each: date, decision, reason.

- 2026-11-28 Tooling versions: Node v24.12.0, pnpm 12.3.4, Docker 29.7.2, AWS CLI 2.42.1, CDK CLI 2.1149.0. Already installed, nothing to add.
- 2026-11-28 Added `packages/shared` (types, verdict helpers) beyond the SPECS layout: avoids duplicating the data model between web and api.
- 2026-11-28 DynamoDB Local image pinned to `amazon/dynamodb-local:2.6.1` (official upstream).
- 2026-11-28 Finding id is `<fileId>~<clauseId>`: lets `POST /findings/:id/actions` locate the partition without a lookup.
- 2026-11-28 Only the demo file (`f01`) has a document + analysis; the other 24 queue files are metadata only (EmptyState in the workspace). Breadth over depth.
- 2026-11-28 API Gateway HTTP API caps integrations at 30 s, so the cloud seed runs the analysis from this PC (same `analyseFile` code, real DynamoDB/S3/Bedrock) instead of through a Lambda request.
- 2026-11-28 Hono routes live under `/api` so CloudFront can forward `/api/*` to API Gateway unchanged; `/healthz` is also served at the root.
- 2026-11-28 Visual baselines have no platform suffix and use a small pixel-ratio tolerance, so Windows-made baselines remain usable on the Linux CI runner.
