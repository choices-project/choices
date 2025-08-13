# Architecture

Two services:
- **Identity Authority (IA)**: account + verification + blinded token issuance (Privacy Pass style). Keys in KMS. No PII leaves this boundary.
- **Polling Operator (PO)**: poll lifecycle, token redemption, per-poll pseudonym enforcement, Merkle commitments, tally reports.

Public append-only **Commitment Log** is published as snapshots (JSON) and signed releases.
