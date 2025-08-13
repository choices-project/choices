# IA↔PO Protocol (High-Level)

- IA issues blinded tokens bound to `scope = poll:{id}` and `tier` limits.
- Client computes per-poll tag using VOPRF with input `(user_stable_id, poll_id)`; IA verifies and signs.
- PO verifies token via issuer public keys, checks double-spend, associates ballot with `tag`, allows revote (latest wins).
- Receipt: user gets `(leaf_hash, merkle_proof)` for inclusion audit.
