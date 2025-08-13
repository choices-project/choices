# Choices Project Roadmap & Context Tracker

## Project Overview
**Choices** is a neutral, privacy-preserving real-time polling network that enables auditable opinion polling with privacy, integrity, and neutrality by design.

### Core Architecture
- **Two-party system**: Identity Authority (IA) + Polling Operator (PO)
- **Privacy-first**: VOPRF/Privacy Pass-style token issuance
- **Public audit**: Merkle commitments + reproducible tallies
- **Progressive assurance**: Verification tiers T0-T3 (NIST SP 800-63-4)
- **Open governance**: Multi-stakeholder steering, transparent processes

## Current Project State Analysis

### ✅ Completed/Initialized
- [x] Project structure and documentation framework
- [x] Basic Go service stubs (IA on :8081, PO on :8082)
- [x] Next.js web application scaffold
- [x] GitHub Actions CI/CD workflows
- [x] Governance and policy documents
- [x] Architecture Decision Records (ADR) template
- [x] Repository setup and initial commit

### 🔄 In Progress
- [ ] Core protocol implementation
- [ ] VOPRF token issuance system
- [ ] WebAuthn/Passkey integration
- [ ] Merkle commitment system
- [ ] Audit trail implementation

### 📋 Immediate Next Steps (Priority Order)

#### Phase 1: Core Protocol Foundation
1. **VOPRF Implementation**
   - [ ] Implement VOPRF library for Go services
   - [ ] Add blinded token issuance in IA
   - [ ] Add token verification in PO
   - [ ] Implement per-poll pseudonym generation

2. **Basic API Endpoints**
   - [ ] IA: Token issuance endpoint
   - [ ] IA: User verification endpoints
   - [ ] PO: Poll creation and management
   - [ ] PO: Vote submission and validation
   - [ ] PO: Tally computation and reporting

3. **Database Schema**
   - [ ] Design IA database (users, tokens, verification data)
   - [ ] Design PO database (polls, votes, commitments)
   - [ ] Implement database migrations

#### Phase 2: Privacy & Security
4. **WebAuthn Integration**
   - [ ] Implement passkey authentication in web app
   - [ ] Add device attestation verification
   - [ ] Integrate with IA verification system

5. **Merkle Commitment System**
   - [ ] Implement Merkle tree for vote commitments
   - [ ] Add receipt generation for voters
   - [ ] Create public commitment log

6. **Rate Limiting & Anti-Sybil**
   - [ ] Implement issuance rate limits
   - [ ] Add device integrity checks
   - [ ] Implement double-spend prevention

#### Phase 3: Verification Tiers
7. **Tier Implementation**
   - [ ] T0: Basic human presence verification
   - [ ] T1: WebAuthn/Passkey verification
   - [ ] T2: Personhood verification (liveness + ID)
   - [ ] T3: Citizenship/residency verification

8. **Weighting System**
   - [ ] Implement tier-based vote weighting
   - [ ] Add demographic breakdowns with privacy
   - [ ] Create differential privacy mechanisms

#### Phase 4: Audit & Transparency
9. **Audit Trail**
   - [ ] Implement reproducible tally scripts
   - [ ] Add commitment log publishing
   - [ ] Create independent observer program

10. **Governance Tools**
    - [ ] Poll sponsorship system
    - [ ] Public comment windows
    - [ ] Conflict disclosure tracking

## Technical Specifications

### Standards Compliance
- **WebAuthn/Passkeys**: Device-based authentication
- **Privacy Pass**: Architecture & issuance patterns
- **VOPRF**: RFC 9497 implementation
- **W3C VC 2.0**: Verifiable credentials
- **NIST SP 800-63-4**: Identity assurance levels

### Security Properties
- **Unlinkability**: Per-poll pseudonyms prevent cross-poll linkage
- **Rate limiting**: Issuance limits prevent Sybil attacks
- **Auditability**: Merkle commitments enable public verification
- **Neutrality**: Architecture prevents operator bias

### Threat Model (STRIDE-lite)
- **Bots/Sybils**: Mitigated by passkeys, device integrity, rate limits
- **Operator malfeasance**: Mitigated by public commitments, reproducible tallies
- **De-anonymization**: IA/PO split, per-poll tags, minimal logs
- **Coercion**: Receipts prove inclusion, not choice

## Development Guidelines

### Code Organization
- `server/ia/`: Identity Authority service (Go)
- `server/po/`: Polling Operator service (Go)
- `web/`: Next.js frontend application
- `specs/`: Protocol specifications
- `docs/`: Architecture and design documents
- `adr/`: Architecture Decision Records

### Testing Strategy
- Unit tests for core cryptographic operations
- Integration tests for IA-PO protocol
- End-to-end tests for complete voting flow
- Security testing for privacy properties

### Deployment Considerations
- IA and PO must be deployable independently
- Public commitment log requires high availability
- Observer program needs independent deployment capability
- All builds must be reproducible

## Success Metrics

### Technical Metrics
- [ ] VOPRF token issuance working end-to-end
- [ ] Merkle commitment system operational
- [ ] WebAuthn integration complete
- [ ] All verification tiers implemented
- [ ] Audit trail fully functional

### Privacy Metrics
- [ ] No cross-poll linkage possible
- [ ] Rate limiting prevents Sybil attacks
- [ ] Differential privacy on demographic data
- [ ] Receipts prove inclusion without revealing choice

### Governance Metrics
- [ ] Multi-stakeholder steering operational
- [ ] Transparent decision-making process
- [ ] Independent observer program active
- [ ] Conflict disclosure system functional

## Risk Mitigation

### Technical Risks
- **Cryptographic vulnerabilities**: Regular security audits, formal verification
- **Performance bottlenecks**: Load testing, optimization
- **Integration complexity**: Incremental development, comprehensive testing

### Privacy Risks
- **De-anonymization attacks**: Regular threat modeling, privacy audits
- **Coercion resistance**: Receipt design, disclosure controls
- **Data breaches**: Minimal data retention, encryption at rest

### Governance Risks
- **Bias introduction**: Neutrality policy enforcement, independent oversight
- **Centralization**: Decentralized deployment model, open source
- **Regulatory compliance**: Legal review, compliance monitoring

---

**Last Updated**: [Current Date]
**Next Review**: [Weekly]
**Status**: Initial Analysis Complete - Ready for Phase 1 Implementation
