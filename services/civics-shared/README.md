# @choices/civics-shared

Reusable helpers for working with civics data in the Choices platform.

## Overview

This package is the **single source of truth** for election, campaign finance, and policy–issue utilities. It powers:

- The **standalone ingest service** (`services/civics-backend`) – FEC office codes, district normalization, issue signals from bills, etc.
- The **web app** (`web`) – unified orchestrator and civics features.

Both consume `@choices/civics-shared` so behaviour stays identical across the stack. Civic‑minded projects can reuse this module with their own ingest or UI.

## Exposed helpers

- Division + election metadata (`extractDivisionMetadata`, `determineRaceImportance`, `estimateDeadline`, `buildLookupAddress`)
- Issue signals derived from OpenStates bills (`deriveKeyIssuesFromBills`)
- Campaign finance utilities shared by the FEC enrichment (`determineOfficeCode`, `normalizeDistrict`, `calculateCashOnHand`, `resolveLastFilingDate`, `buildCampaignActivity`, …)

See [`index.d.ts`](./index.d.ts) for full type signatures.

## Usage

```ts
import {
  deriveKeyIssuesFromBills,
  determineOfficeCode,
  buildCampaignActivity,
} from '@choices/civics-shared';

const issues = deriveKeyIssuesFromBills(openStatesBills);
const officeCode = determineOfficeCode('U.S. House of Representatives');
const activity = buildCampaignActivity(candidates, 2026);
```

The package ships as pure ESM with TypeScript declarations, so it can be imported from both Node scripts and browser bundles.

## Development

The module is intentionally lightweight: plain JavaScript with type declarations. No build step is required, but you can run `npm install` from the package directory to add additional tooling if needed.

## Keeping `web/services-civics-shared` aligned

The web app keeps a copy at `web/services-civics-shared` for Vercel builds. When you change this package, sync the web copy:

```bash
cp -r services/civics-shared/index.js services/civics-shared/index.d.ts services/civics-shared/package.json web/services-civics-shared/
cp services/civics-shared/tests/shared.test.mjs web/services-civics-shared/tests/
```

The deploy workflow overwrites the web copy from `services/civics-shared` on each production deploy, so CI keeps them aligned.

