# Choice: A Neutral, Privacy-Preserving Real‑Time Polling Network

**Goal:** enable real-time, auditable opinion polling with *privacy*, *integrity*, and *neutrality* by design.

## Highlights
- **Two-party architecture**: Identity Authority (IA) issues privacy-preserving tokens; Polling Operator (PO) runs polls and tallies. IA ≠ PO.
- **Privacy first**: VOPRF/Privacy Pass–style issuance for unlinkable, rate-limited participation. Per-poll pseudonyms allow **revoting** without cross-poll linkage.
- **Public audit**: Merkle commitments + reproducible tally scripts.
- **Progressive assurance**: Verification tiers (T0–T3) mapped to NIST SP 800-63-4 language.
- **Open governance & neutrality**: multi-stakeholder steering, transparent processes, reproducible builds, and standard community health metrics (CHAOSS).

## Repo Layout
- `docs/` – architecture, protocol, threat model, verification tiers, neutrality policy, governance.
- `specs/` – IA↔PO protocol details, receipts, and audit trails.
- `server/` – Go service stubs for IA and PO.
- `web/` – Next.js App Router scaffold with passkey (WebAuthn) login stub.
- `.github/workflows/` – Standards/Advisory watchers and CI.
- `adr/` – Architecture Decision Records.
- `CONTRIBUTING.md` – how to contribute; security and bias safeguards.
- `GOVERNANCE.md`, `NEUTRALITY_POLICY.md`, `TRANSPARENCY.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`.

## Quick Start (dev)
```bash
# Identity Authority
cd server/ia && go run ./cmd/ia
# Polling Operator
cd server/po && go run ./cmd/po
# Web
cd web && npm install && npm run dev
```

> **Standards referenced**: WebAuthn/Passkeys, Privacy Pass (architecture & issuance), VOPRF (RFC 9497), W3C VC 2.0, NIST SP 800‑63‑4.
See `docs/standards.md` for pointers and exact citations.

## License
AGPL-3.0-only. See `LICENSE`.
