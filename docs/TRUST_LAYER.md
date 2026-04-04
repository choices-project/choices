# Trust layer

_Last updated: April 4, 2026_

This document defines how **verification (trust tiers)** relates to **privacy**, **equal poll tabulation**, and **optional aggregate research**. Product copy and the [Privacy Policy](PRIVACY_POLICY.md) should stay consistent with it.

## Goals

1. **Reduce abuse** — Sybils, coordinated inauthentic behavior, and credential farming undermine civic tools. Optional verification raises the cost of large-scale manipulation.
2. **Signal legitimacy** — Constituents and moderators may need to know whether an account completed a proportionate check without exposing unnecessary personal data.
3. **Preserve clarity on votes** — Where the product promises **equal voting** in poll **results shown to users**, tallies must not silently apply pay-to-weight or undisclosed multipliers.

## Tiers (conceptual)

T0–T3 label **progressive verification** (exact rules are product-specific). In general:

- **T0** — Default: minimal data, full privacy controls.
- **Higher tiers** — Additional checks (e.g., email domain, official correspondence, or document-backed flows) **only when the user opts in** and where legally viable.

**Principle:** Prefer **district- or geography-level keys** over full street address. If address is collected for verification, **minimize retention** (verify, then discard or store only a stable derived token as appropriate).

## Equal votes vs verification

- **Equal tabulation** — For standard poll results in the UI, **one participant counts as one vote** in that tally (subject to one legitimate account / anti-fraud rules).
- **Verified-weighted or analyst views** — If the product ever exposes breakdowns that weight or filter by tier, they must be **clearly labeled** as distinct from the default public tally.

## Database analytics (`calculate_trust_*` RPCs)

Some PostgreSQL functions segment or analyze votes **by trust tier** for dashboards, admin tooling, or experiments. They are **not** a license to change the default **equal-weight** story users see in the primary poll UI.

| Function (generated types) | Intended use |
|----------------------------|---------------|
| **`calculate_trust_filtered_votes`** | **Display / analytics** — filtered or segmented views; must stay clearly labeled if shown to users. |
| **`get_poll_results_by_trust_tier`**, **`get_poll_votes_by_trust_tier`** | Same bucket: breakdowns for analysis or labeled UI. |
| **`calculate_trust_weighted_votes`** | **Do not use for product tallies.** May still appear in `web/types/supabase.ts` if the remote DB retains the symbol; application code must not call it for official results. |

Canonical detail: **[`DATABASE_SCHEMA.md` § RPC Functions](DATABASE_SCHEMA.md#rpc-functions)** (including the legacy-weight subsection), **[`archive/reference/VOTING_INTEGRITY_POLICY.md`](archive/reference/VOTING_INTEGRITY_POLICY.md)** (policy), and **[`ROADMAP.md`](ROADMAP.md)** (product status).

## Data we try not to sell

- **Never:** Row-level exports that identify individuals tied to votes, exact location, or contact fields for commercial resale.
- **Maybe (opt-in only):** Aggregate or differentially private **Insights Panel** style programs under explicit consent, contracts, revocation, and minimum cell sizes. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md).

## Public vs admin visibility

| Data / action            | User | Other users | Administrators / ops |
|-------------------------|------|-------------|----------------------|
| Poll choice (default)   | Y    | Per visibility rules | Abuse investigation only |
| Trust tier badge        | If user enables | If user enables | Y (audit) |
| Verification artifacts  | Summary only | No | Restricted |

## Ownership

- **Owner:** Core maintainer  
- **Review:** When verification flows, poll math, or privacy policy changes  
- **Last verified:** 2026-04-04 (documentation accuracy and codebase-reference review)
