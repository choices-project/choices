# IA–PO Protocol (Message Sketch)

1. **Token Issuance (Client↔IA)**  
   - Client prepares blinded tokens for `scope=poll:{id}`, `tier=tX`  
   - IA validates verification & policy → signs blinded tokens → returns

2. **Vote (Client↔PO)**  
   - Client unblinds; submits `{token, tag, choice}` to PO  
   - PO verifies token signature and scope; checks uniqueness by `tag`

3. **Audit**  
   - PO appends `(tag, encrypted_choice)` leaf; returns receipt  
   - Periodically publish Merkle root + tally report

Security properties rely on VOPRF-based tags and unlinkable issuance.
