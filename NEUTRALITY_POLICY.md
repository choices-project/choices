# Neutrality Policy

**Purpose:** ensure no party can credibly claim partisan bias in operation, topic selection, weighting, or reporting.

1. **Architecture neutrality**: IA and PO are separate deployable projects. The software enables anyone to run either role independently.
2. **Open access**: All poll commitments, tallies, and code are public under AGPL-3.0; reproducible builds documented in `docs/reproducibility.md`.
3. **Topic governance**: Any poll requires two independent sponsors from different affiliations; a 48h public comment window; and published rationale.
4. **Weighting transparency**: Verification tier weights are published and versioned (`policy/weights.json`), with change logs and effective dates.
5. **Cell-size protections**: Demographic breakdowns only where cell size ≥ k (default 250) with differential privacy noise when applicable.
6. **Observer program**: Independent observers can mirror commitments and reproduce tallies.
7. **Conflict disclosures**: Maintainers and sponsors must disclose material ties in `GOVERNANCE.md` appendices.
