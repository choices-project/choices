# Context Tracker - Choices Project

## Current Session Context
**Date**: [Current Date]  
**Session Goal**: Initial project analysis and roadmap creation  
**Current Focus**: Phase 1 - Core Protocol Foundation  

## Project Context Summary

### What We're Building
A **neutral, privacy-preserving real-time polling network** that enables auditable opinion polling with privacy, integrity, and neutrality by design.

### Key Architectural Decisions
1. **Two-party separation**: IA (Identity Authority) ≠ PO (Polling Operator)
2. **Privacy-first approach**: VOPRF/Privacy Pass-style token issuance
3. **Public auditability**: Merkle commitments + reproducible tallies
4. **Progressive verification**: T0-T3 tiers mapped to NIST SP 800-63-4
5. **Open governance**: Multi-stakeholder steering with transparency

### Current Implementation State
- **IA Service**: Basic HTTP server on :8081 (health check only)
- **PO Service**: Basic HTTP server on :8082 (health check only)  
- **Web App**: Next.js scaffold with placeholder passkey UI
- **Documentation**: Comprehensive framework in place
- **CI/CD**: GitHub Actions workflows configured

## Immediate Next Actions

### Phase 1 Priority 1: VOPRF Implementation
**Status**: Not Started  
**Dependencies**: None  
**Estimated Effort**: 2-3 days  

**Tasks**:
1. [ ] Research and select VOPRF library for Go
2. [ ] Implement blinded token issuance in IA
3. [ ] Implement token verification in PO
4. [ ] Add per-poll pseudonym generation
5. [ ] Create integration tests

**Key Considerations**:
- Must follow RFC 9497 VOPRF specification
- Need to handle key management securely
- Should support multiple verification tiers
- Must prevent cross-poll linkage

### Phase 1 Priority 2: Basic API Endpoints
**Status**: Not Started  
**Dependencies**: VOPRF implementation  
**Estimated Effort**: 3-4 days  

**Tasks**:
1. [ ] Design REST API specifications
2. [ ] Implement IA token issuance endpoint
3. [ ] Implement IA user verification endpoints
4. [ ] Implement PO poll management endpoints
5. [ ] Implement PO vote submission endpoint
6. [ ] Add input validation and error handling

## Technical Context

### Standards We're Following
- **WebAuthn/Passkeys**: For device-based authentication
- **Privacy Pass**: Architecture patterns for token issuance
- **VOPRF (RFC 9497)**: For unlinkable token generation
- **W3C VC 2.0**: For verifiable credentials
- **NIST SP 800-63-4**: For identity assurance levels

### Security Properties We Must Maintain
1. **Unlinkability**: Per-poll pseudonyms prevent cross-poll linkage
2. **Rate limiting**: Issuance limits prevent Sybil attacks
3. **Auditability**: Merkle commitments enable public verification
4. **Neutrality**: Architecture prevents operator bias

### Threat Model (STRIDE-lite)
- **Bots/Sybils**: Mitigated by passkeys, device integrity, rate limits
- **Operator malfeasance**: Mitigated by public commitments, reproducible tallies
- **De-anonymization**: IA/PO split, per-poll tags, minimal logs
- **Coercion**: Receipts prove inclusion, not choice

## Development Context

### Code Organization
```
server/ia/          # Identity Authority service (Go)
server/po/          # Polling Operator service (Go)
web/                # Next.js frontend application
specs/              # Protocol specifications
docs/               # Architecture and design documents
adr/                # Architecture Decision Records
```

### Current Dependencies
- **Go 1.22**: For server services
- **Next.js 14.2.5**: For web application
- **React 18.2.0**: For frontend components

### Missing Dependencies (To Add)
- VOPRF library for Go
- Database driver (PostgreSQL recommended)
- WebAuthn library for Go
- Merkle tree implementation
- Testing framework (testify)

## Governance Context

### Neutrality Requirements
1. **Architecture neutrality**: IA and PO must be separately deployable
2. **Open access**: All code under AGPL-3.0, reproducible builds
3. **Topic governance**: Two independent sponsors + 48h comment window
4. **Weighting transparency**: Published and versioned tier weights
5. **Cell-size protections**: Demographic breakdowns with privacy
6. **Observer program**: Independent mirrors and reproduction
7. **Conflict disclosures**: Material ties must be disclosed

### Steering Council Structure
- **7 seats**: 2 civil society, 2 academia, 2 industry, 1 at-large
- **One-year staggered terms**
- **Elections**: Condorcet or STV with transparent elector rolls

## Session Notes

### Key Decisions Made
1. Created comprehensive roadmap with 4 phases
2. Established context tracking system
3. Identified VOPRF implementation as first priority
4. Documented all architectural constraints and requirements

### Questions to Resolve
1. Which VOPRF library to use for Go?
2. Database choice (PostgreSQL vs other)?
3. Key management strategy for IA?
4. Deployment strategy for public commitment log?

### Next Session Goals
1. Begin VOPRF implementation
2. Set up database schemas
3. Create basic API endpoints
4. Add comprehensive testing

---

**Context Last Updated**: [Current Date]  
**Next Context Review**: [Before next development session]  
**Context Status**: ✅ Complete - Ready for implementation
