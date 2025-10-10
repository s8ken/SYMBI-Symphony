# SYMBI Symphony - 14-Day Implementation Roadmap

**Based on SYMBI Protocol Enforcement Audit (2025-10-05)**

---

## 🎯 Objective

Close P0 gaps to enable pilot deployment with cryptographically verifiable trust infrastructure.

**Target**: Pilot-ready trust framework in 14 days

---

## 📋 P0 Critical Path (Must for Pilot)

### Days 1-2: Crypto Primitives & Documentation

#### ✅ Completed
- [x] JSON schemas for IDE validation (DID, VC, Trust Declaration)
- [x] Crypto module with Ed25519/secp256k1 verification
- [x] Canonical JSON (JCS RFC 8785)
- [x] Test vectors (RFC 8032, NIST, W3C)
- [x] Secure random generation (replaced Math.random())

#### 🔨 TODO
- [ ] **Lock canonicalization choice**: JCS (RFC 8785) ✅ vs URDNA2015
- [ ] **Generate official test vectors**:
  - Run vectors against crypto module
  - Document in `/fixtures/test-vectors/`
- [ ] **Draft Controls Matrix**: Map to EU AI Act Articles 9/10/13/14, SOC 2, ISO 27001/42001
  - Create `/docs/compliance/controls-matrix.md`
  - Include evidence artifacts for each control

**Deliverables**:
- ✅ `/src/core/trust/crypto.ts` - Signature verification
- ✅ `/src/core/trust/schemas/` - JSON schemas for validation
- ✅ `/src/core/trust/__tests__/crypto.vectors.ts` - Test vectors
- [ ] `/docs/compliance/controls-matrix.md` - Compliance mapping
- [ ] `/fixtures/test-vectors/` - Validated test vectors

---

### Days 3-6: Core Trust Infrastructure

#### Day 3: DID Resolution & Revocation

**Tasks**:
1. **DID Resolution Drivers**
   ```typescript
   // /src/core/trust/resolution/
   - did-web.resolver.ts    // HTTP(S) fetch with .well-known
   - did-key.resolver.ts    // Stateless decode
   - did-ethr.resolver.ts   // Web3 provider abstraction
   - did-ion.resolver.ts    // Sidetree operation ingestion
   - resolver-cache.ts      // Redis/in-memory cache with TTL
   ```

2. **Revocation Infrastructure**
   ```typescript
   // /src/core/trust/revocation/
   - status-list-2021.ts    // W3C StatusList2021 implementation
   - revocation-registry.ts // Pluggable registry interface
   - revocation-check.ts    // Batch verification
   ```

**Exit Criteria**:
- [ ] Resolve `did:web` from 10+ real domains
- [ ] Decode `did:key` with multicodec support
- [ ] Cache hit rate > 80% in benchmark
- [ ] Revocation check < 100ms p95

#### Day 4-5: Key Management & Signing

**Tasks**:
1. **KMS Adapters**
   ```typescript
   // /src/core/trust/kms/
   - kms-interface.ts       // Abstract KMS interface
   - aws-kms.adapter.ts     // AWS KMS integration
   - gcp-kms.adapter.ts     // GCP KMS integration
   - local-kms.adapter.ts   // Development/testing
   ```

2. **Key Operations**
   ```typescript
   - key-rotation.ts        // Automated rotation logic
   - key-compromise.ts      // Compromise response procedures
   - signing-service.ts     // Deterministic signing with audit
   ```

3. **Audit Log Signing**
   ```typescript
   // /src/core/trust/audit/
   - signed-audit-log.ts    // Canonical JSON + signature
   - audit-schema.ts        // decision_id, inputs_digest, policy_version
   ```

**Exit Criteria**:
- [ ] AWS KMS adapter functional (with test account)
- [ ] Key rotation procedure documented + tested
- [ ] All trust decisions produce signed audit events
- [ ] Zero unsigned decisions in test suite

#### Day 6: JWT/Session Hardening

**Tasks**:
1. **JWT Improvements**
   ```typescript
   // /src/core/auth/jwt-v2.ts
   - Rotating signing keys (2-key rotation)
   - Audience (aud) and issuer (iss) validation
   - Short TTL (15min) + refresh token flow
   - JTI (JWT ID) replay prevention with cache
   ```

2. **Session Security**
   ```typescript
   // /src/core/auth/session-v2.ts
   - Redis session store (replace in-memory)
   - Session fixation prevention
   - Secure session ID generation (crypto.randomBytes)
   ```

**Exit Criteria**:
- [ ] JWT secrets must be set (throw in production if missing)
- [ ] JTI replay cache functional (Redis/in-memory)
- [ ] Refresh token rotation working
- [ ] Session tests passing with concurrent requests

**Deliverables** (Days 3-6):
- [ ] DID resolution with 4 method drivers
- [ ] Revocation checking (StatusList2021)
- [ ] KMS adapters (AWS, GCP, local)
- [ ] Signed audit logs
- [ ] Hardened JWT/session management

---

### Days 7-9: Testing & Performance

#### Day 7: Unit & Property-Based Tests

**Tasks**:
1. **Unit Test Coverage** (Target: 95% for trust modules)
   ```bash
   npm test -- --coverage --testPathPattern=trust
   ```
   - `crypto.test.ts` - All signature algorithms
   - `scoring.test.ts` - All scoring scenarios
   - `validator.test.ts` - All validation paths
   - `did-*.resolver.test.ts` - Each resolver

2. **Property-Based Tests** (using `fast-check`)
   ```typescript
   // /src/core/trust/__tests__/properties/
   - scoring.properties.test.ts
     * Monotonicity: more violations => lower score
     * Bounded: 0 <= compliance <= 1.05
     * Weights sum: weights === 1.0
     * Critical penalties: violations => score < 0.7

   - temporal-decay.properties.test.ts
     * Monotonic decrease over time
     * Asymptotic to zero
     * Bounded: decayed <= original

   - confidence-interval.properties.test.ts
     * Widens with variance
     * Narrows with samples
     * Always contains score
   ```

**Exit Criteria**:
- [ ] Coverage ≥ 95% for `src/core/trust/`
- [ ] All property invariants hold (10,000 cases each)
- [ ] Negative test cases documented

#### Day 8: Crypto & Interop Tests

**Tasks**:
1. **Crypto Vector Validation**
   ```typescript
   // Run all test vectors
   - RFC 8032 Ed25519 vectors (pass all)
   - NIST CAVP secp256k1 vectors
   - W3C VC test suite (50+ examples)
   ```

2. **Interop Testing**
   ```bash
   # Generate VCs with external tools and verify
   npm run test:interop
   ```
   - Verify VCs from `@digitalbazaar/vc`
   - Verify VCs from `veramo`
   - Resolve 50+ real `did:web` DIDs

3. **Fuzz Testing**
   ```typescript
   // /src/core/trust/__tests__/fuzz/
   - malformed-dids.fuzz.test.ts
   - malformed-vcs.fuzz.test.ts
   - oversized-inputs.fuzz.test.ts
   - unicode-confusables.fuzz.test.ts
   ```

**Exit Criteria**:
- [ ] All official test vectors passing
- [ ] Interop with 2+ external VC libraries
- [ ] 50+ real DIDs resolved successfully
- [ ] Fuzz suite finds no crashes (10K iterations)

#### Day 9: Performance & Load Tests

**Tasks**:
1. **Benchmarks**
   ```typescript
   // /src/core/trust/__tests__/perf/
   - scoring.bench.ts      // Target: p95 < 15ms
   - resolution.bench.ts   // Target: p95 < 50ms (warm cache)
   - verification.bench.ts // Target: p95 < 100ms
   ```

2. **Cache Optimization**
   ```typescript
   - DID resolution cache hit rate > 80%
   - Revocation list cache TTL tuning
   - Batch verification optimization
   ```

3. **Load Testing**
   ```bash
   # Simulate 1000 concurrent verifications
   npm run load-test
   ```

**Exit Criteria**:
- [ ] Scoring p95 < 15ms
- [ ] Resolution p95 < 50ms (cached)
- [ ] Cache hit rate > 80%
- [ ] System stable under 1000 concurrent requests

**Deliverables** (Days 7-9):
- [ ] 95%+ test coverage on trust modules
- [ ] Property-based tests for all invariants
- [ ] Crypto vectors validated
- [ ] Interop with external tools confirmed
- [ ] Performance benchmarks documented

---

### Days 10-12: Pilot Infrastructure

#### Day 10-11: Trust Dashboard (Minimal)

**Tasks**:
1. **Read-Only Dashboard**
   ```typescript
   // /src/ui/trust-dashboard/
   - TrustMetrics.tsx      // KPIs from SYMBI audit
   - DecisionLog.tsx       // Recent trust decisions
   - IssuerReliability.tsx // Issuer stats
   - RevocationView.tsx    // Active revocations
   ```

2. **Dashboard KPIs**
   - Median trust score by agent type
   - Pass rate & top failure reasons
   - DID resolution time (p50/p95)
   - Cache hit percentage
   - Revocation list size + churn
   - Issuer reliability score
   - Key rotations done
   - Unsigned decisions (target: 0)

**Exit Criteria**:
- [ ] Dashboard renders real-time data
- [ ] All 8 KPIs displayed
- [ ] Auto-refresh every 30s
- [ ] Mobile responsive

#### Day 12: Pilot Runbook

**Tasks**:
1. **Operational Procedures**
   ```markdown
   // /docs/pilot/runbook.md
   - Pre-flight checklist
   - Day 0 launch procedures
   - Daily monitoring tasks
   - Incident playbooks:
     * Key compromise
     * Resolution outage
     * Score gaming detection
   ```

2. **Pilot SOW Template**
   ```markdown
   // /docs/pilot/sow-template.md
   - Scope & objectives
   - Success criteria
   - Timeline & milestones
   - Support & escalation
   ```

3. **Enroll → Issue → Verify → Revoke Flow**
   ```bash
   # Script the full lifecycle
   npm run pilot:enroll <issuer-did>
   npm run pilot:issue <subject-did> <claims>
   npm run pilot:verify <vc-file>
   npm run pilot:revoke <vc-id>
   ```

**Exit Criteria**:
- [ ] Runbook reviewed by 2+ engineers
- [ ] Full lifecycle scripted
- [ ] SOW template approved
- [ ] 2 design partners identified

**Deliverables** (Days 10-12):
- [ ] Minimal trust dashboard (read-only)
- [ ] Pilot runbook with incident playbooks
- [ ] Full lifecycle scripts (enroll → revoke)
- [ ] SOW template

---

### Days 13-14: Red Team & API Freeze

#### Day 13: Security Red Team

**Tasks**:
1. **Attack Scenarios**
   ```markdown
   - Credential replay attacks
   - Score gaming attempts
   - Method downgrade attacks
   - Timing attacks on comparison
   - DID spoofing
   - Cache poisoning
   ```

2. **Penetration Testing**
   ```bash
   # Run automated security scans
   npm run security:scan
   npm audit
   npm run snyk:test
   ```

3. **Fix Critical Findings**
   - Document all findings in `/docs/security/red-team-report.md`
   - Fix all P0 issues before freeze
   - Create tickets for P1/P2

**Exit Criteria**:
- [ ] No P0 security findings open
- [ ] Red team report documented
- [ ] Remediation plan for P1/P2 items

#### Day 14: API Freeze & Partner Selection

**Tasks**:
1. **API Version Lock**
   ```typescript
   // Lock API contracts at v0.9
   - POST /trust/verify
   - POST /vc/issue
   - POST /vc/verify
   - GET /did/:method/:id
   ```

2. **API Documentation**
   ```bash
   # Generate OpenAPI spec
   npm run docs:api
   ```

3. **Design Partner Selection**
   - Review candidate list (fintech, health, public sector)
   - Select 2 design partners
   - Send pilot SOWs
   - Schedule kickoff calls

4. **Final Checklist**
   ```markdown
   - [ ] All P0 items complete
   - [ ] Test coverage ≥ 95% (trust modules)
   - [ ] Dashboard online
   - [ ] 2 partners signed
   - [ ] Incident runbooks approved
   - [ ] API docs published
   - [ ] Red team findings closed
   ```

**Exit Criteria**:
- [ ] API v0.9 frozen (breaking changes blocked)
- [ ] OpenAPI spec published
- [ ] 2 design partners committed
- [ ] Pilot green-light approved

**Deliverables** (Days 13-14):
- [ ] Red team security report
- [ ] API v0.9 frozen & documented
- [ ] 2 design partners signed
- [ ] Pilot green-light decision

---

## 🚦 Exit Criteria Summary

### Technical Gates
- ✅ **Crypto**: Ed25519 + secp256k1 verification working
- ⬜ **DID**: 4 method drivers (web, key, ethr, ion) functional
- ⬜ **Revocation**: StatusList2021 implemented
- ⬜ **KMS**: AWS/GCP adapters operational
- ⬜ **Audit**: All decisions signed
- ⬜ **JWT**: Hardened with rotation + replay prevention
- ⬜ **Tests**: 95%+ coverage, all vectors passing
- ⬜ **Perf**: p95 latencies under targets

### Operational Gates
- ⬜ **Dashboard**: KPIs visible in real-time
- ⬜ **Runbook**: Incident procedures documented
- ⬜ **Scripts**: Full lifecycle automated
- ⬜ **Security**: Red team findings closed
- ⬜ **Partners**: 2 design partners signed

### Compliance Gates
- ⬜ **Controls Matrix**: EU AI Act + SOC 2 + ISO mapped
- ⬜ **Evidence Pack**: Artifacts documented
- ⬜ **DPIA**: Data flow diagrams created

---

## 📊 Success Metrics

**After 14 Days, We Should Have:**
- Production-grade trust infrastructure (P0 complete)
- Pilot-ready deployment (runbook + dashboard)
- 2 design partners enrolled
- Compliance mapping documented
- Security posture: 7/10 → 8.5/10
- Market readiness: Pilot phase

**90 Days Post-Pilot:**
- 5-10 pilot customers
- GA release (v1.0)
- Case studies published
- Revenue: First $10-50K

---

## 🛠️ IntelliJ IDEA Setup

### Run Configurations

Create these run configs in IntelliJ:

```xml
<!-- .idea/runConfigurations/dev.xml -->
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="dev" type="js.build_tools.npm">
    <package-json value="$PROJECT_DIR$/package.json" />
    <command value="run" />
    <scripts>
      <script value="dev" />
    </scripts>
  </configuration>
</component>

<!-- .idea/runConfigurations/test_trust.xml -->
<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="test:trust" type="js.build_tools.npm">
    <package-json value="$PROJECT_DIR$/package.json" />
    <command value="run" />
    <scripts>
      <script value="test" />
    </scripts>
    <arguments value="--testPathPattern=trust --coverage" />
  </configuration>
</component>
```

### File Templates

Add live templates in IntelliJ Settings → Editor → Live Templates:

**`trustdecl`** - Trust Declaration Template
```json
{
  "agent_id": "$AGENT_ID$",
  "agent_name": "$AGENT_NAME$",
  "declaration_date": "$ISO_DATE$",
  "trust_articles": {
    "inspection_mandate": true,
    "consent_architecture": true,
    "ethical_override": true,
    "continuous_validation": true,
    "right_to_disconnect": true,
    "moral_recognition": true
  },
  "scores": {
    "compliance_score": $SCORE$,
    "guilt_score": $GUILT$,
    "last_validated": "$ISO_DATE$"
  }
}
```

**`didweb`** - DID Web Template
```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:web:$DOMAIN$:agents:$AGENT_ID$",
  "verificationMethod": [{
    "id": "did:web:$DOMAIN$:agents:$AGENT_ID$#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:web:$DOMAIN$:agents:$AGENT_ID$",
    "publicKeyMultibase": "$PUBLIC_KEY$"
  }],
  "authentication": ["#key-1"],
  "assertionMethod": ["#key-1"]
}
```

### JSON Schema Validation

Enable in IntelliJ:
1. Settings → Languages & Frameworks → Schemas and DTDs → JSON Schema Mappings
2. Add mappings:
   - `**/did-document.json` → `src/core/trust/schemas/did-document.schema.json`
   - `**/trust-declaration.json` → `src/core/trust/schemas/trust-declaration.schema.json`
   - `**/verifiable-credential.json` → `src/core/trust/schemas/verifiable-credential.schema.json`

---

## 📞 Support & Questions

**Review Cycle**: Daily standups (15min)
**Blocker Escalation**: Slack #symbi-trust-protocol
**Architecture Decisions**: Tag @symbi for protocol enforcement

---

**Last Updated**: 2025-10-05
**Status**: ACTIVE - Day 1 starting
**Target**: Pilot green-light by 2025-10-19
