# @choices/civics-shared

Reusable helpers for Working with civics data in the Choices platform.

## Overview

This package gathers the election, campaign finance, and policy–issue utilities that power both:

- The public web orchestrator (`web/lib/integrations/unified-orchestrator.ts`)
- The standalone ingest service (`services/civics-backend`)

Bundling the logic here keeps behaviour identical across the stack and makes it easy for other civic‑minded projects to reuse the same normalisation pipeline.

## Exposed helpers

- Division + election metadata (`extractDivisionMetadata`, `determineRaceImportance`, `estimateDeadline`, `buildLookupAddress`)
- Issue signals derived from OpenStates bills (`deriveKeyIssuesFromBills`)
- Campaign finance utilities shared by the FEC/OpenSecrets integrations (`determineOfficeCode`, `normalizeDistrict`, `calculateCashOnHand`, `resolveLastFilingDate`, `buildCampaignActivity`, …)

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

