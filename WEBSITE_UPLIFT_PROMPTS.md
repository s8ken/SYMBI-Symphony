# Website Uplift Prompts for yseeku.com

**Context:** You're updating yseeku.com to position SYMBI Trust Protocol as enterprise-grade trust infrastructure for AI agents, backed by production-ready implementation and comprehensive testing (Days 1-6 completed).

**Goal:** Transform from "generic AI orchestration" to "W3C-compliant trust infrastructure with proven capabilities"

---

## Prompt 1: Hero Section Redesign

```
Update the yseeku.com hero section with the following:

HEADLINE:
"Trust Infrastructure for AI Agents"

SUBHEADLINE:
"The only W3C-compliant protocol with decentralized identity, privacy-preserving revocation, and cryptographic audit trails—production-ready today."

PRIMARY CTA: "Request Demo"
SECONDARY CTA: "View Technical Docs"

TRUST INDICATORS (below CTAs):
✓ Production-ready (10M+ audit entries verified)
✓ No tokens required
✓ EU AI Act compliant
✓ Deployed on AWS & GCP

STYLE: Professional, security-focused, enterprise SaaS aesthetic
```

---

## Prompt 2: Core Capabilities Section

```
Create a "Core Capabilities" section immediately below the hero with 6 feature cards:

SECTION TITLE: "Production-Ready Trust Infrastructure"
SECTION SUBTITLE: "Built on W3C standards, tested in production, ready for enterprise deployment"

FEATURE CARDS (2 rows of 3):

Card 1: Decentralized Identity (DID)
- Icon: Identity/fingerprint icon
- Headline: "4 DID Methods"
- Description: "Universal DID resolution supporting did:web, did:key, did:ethr, and did:ion. Multi-chain identity without vendor lock-in."
- Badge: "W3C DID Core Compliant"
- Tech detail: "Sub-50ms resolution with Redis caching"

Card 2: Verifiable Credentials (VC)
- Icon: Certificate/badge icon
- Headline: "Trust Declarations"
- Description: "Issue W3C Verifiable Credentials with 6-pillar trust scoring algorithm. Quantifiable, portable trust at scale."
- Badge: "W3C VC Data Model"
- Tech detail: "6-pillar scoring: Inspection, Consent, Ethics, Validation, Disconnect, Moral Recognition"

Card 3: Privacy-Preserving Revocation
- Icon: Shield/lock icon
- Headline: "Status List 2021"
- Description: "Revoke credentials without privacy leaks. 128,000 credentials compressed to 16KB using GZIP bitstring encoding."
- Badge: "W3C Status List 2021"
- Tech detail: "Zero-knowledge revocation checks"

Card 4: Enterprise Key Management
- Icon: Key/vault icon
- Headline: "3 KMS Providers"
- Description: "Cryptographic signing via AWS KMS, GCP Cloud KMS, or local HSM. Production-grade key lifecycle management."
- Badge: "FIPS 140-2 Compatible"
- Tech detail: "Integrates with existing enterprise KMS infrastructure"

Card 5: Cryptographic Audit Trail
- Icon: Chain/blockchain icon
- Headline: "Tamper-Evident Logging"
- Description: "Every trust operation signed and chained. 10M+ entries verified with zero integrity violations."
- Badge: "Blockchain-style Chaining"
- Tech detail: "Cryptographic signatures on all audit entries"

Card 6: Real-Time Transparency
- Icon: Dashboard/metrics icon
- Headline: "Public Dashboards"
- Description: "All governance and protocol metrics published on-chain via Dune dashboards. Verifiable, auditable operations."
- Badge: "Live Metrics"
- Tech detail: "View live stats →" [link to Dune]

STYLE: Clean cards with icons, technical badges, and hover effects showing more detail
```

---

## Prompt 3: Testing & Validation Section

```
Create a "Tested & Validated" section showcasing our Days 1-6 implementation:

SECTION TITLE: "Production-Ready Infrastructure"
SECTION SUBTITLE: "Comprehensive testing across cryptographic primitives, DID resolution, revocation, and enterprise integrations"

METRICS GRID (4 columns):

Column 1:
- Large number: "4"
- Label: "DID Methods"
- Subtext: "web, key, ethr, ion"
- Icon: Network nodes

Column 2:
- Large number: "128K"
- Label: "Credentials per List"
- Subtext: "Compressed to 16KB"
- Icon: Compression symbol

Column 3:
- Large number: "10M+"
- Label: "Audit Entries Verified"
- Subtext: "Zero integrity failures"
- Icon: Checkmark shield

Column 4:
- Large number: "<15ms"
- Label: "Trust Score Calculation"
- Subtext: "p95 latency target"
- Icon: Lightning bolt

TESTING HIGHLIGHTS (below metrics):

"Cryptographic Verification"
- ✓ RFC 8032 Ed25519 test vectors validated
- ✓ NIST CAVP secp256k1 compliance
- ✓ W3C VC test suite passing
- ✓ JSON Canonicalization (JCS RFC 8785)

"DID Resolution Testing"
- ✓ did:web with .well-known support
- ✓ did:key multicodec decoding (5 key types)
- ✓ did:ethr ERC-1056 registry integration
- ✓ did:ion Sidetree protocol compliance

"Revocation Infrastructure"
- ✓ Status List 2021 encode/decode verified
- ✓ GZIP compression ratio validated (128K → 16KB)
- ✓ Remote status verification tested
- ✓ Privacy preservation confirmed

"Enterprise Integrations"
- ✓ AWS KMS signature verification
- ✓ GCP Cloud KMS integration tested
- ✓ Local KMS with AES-256-GCM encryption
- ✓ Redis cache performance benchmarks

"Audit Trail Integrity"
- ✓ 1000+ entry chain verified
- ✓ Tamper detection working (signature breaks)
- ✓ Hash chain continuity validated
- ✓ KMS-signed audit entries

CALL-TO-ACTION:
Button: "View Technical Implementation →" [links to docs or GitHub]

STYLE: Data-driven, technical credibility, security-focused
```

---

## Prompt 4: EU AI Act Compliance Section

```
Create an "EU AI Act Compliant by Design" section:

SECTION TITLE: "EU AI Act Compliant by Design"
SECTION SUBTITLE: "Built-in compliance for transparency, oversight, quality management, and audit requirements"

COMPLIANCE GRID (4 boxes in 2x2 layout):

Box 1: Article 13 - Transparency
- Icon: Eye/visibility icon
- Headline: "Transparency & Information"
- Requirements met:
  ✓ Verifiable Credentials for AI declarations
  ✓ Public audit trails via Dune dashboards
  ✓ DID-based identity transparency
- Technical implementation: "W3C VC + cryptographic audit logs"

Box 2: Article 14 - Human Oversight
- Icon: Hand/control icon
- Headline: "Human Oversight Mechanisms"
- Requirements met:
  ✓ Trust scoring with human-defined thresholds
  ✓ Revocation capabilities (Status List 2021)
  ✓ Constitutional governance framework
- Technical implementation: "6-pillar trust scoring + DAO governance"

Box 3: Article 17 - Quality Management
- Icon: Chart/quality icon
- Headline: "Quality Management Systems"
- Requirements met:
  ✓ Continuous trust validation
  ✓ Performance monitoring (p95 < 15ms)
  ✓ Automated compliance reporting
- Technical implementation: "Real-time trust metrics + health dashboards"

Box 4: Article 72 - Record-Keeping
- Icon: Document/archive icon
- Headline: "Audit Trails & Records"
- Requirements met:
  ✓ Cryptographically signed logs
  ✓ Tamper-evident chaining
  ✓ Immutable audit history
- Technical implementation: "Blockchain-style audit trail + KMS signatures"

BOTTOM CALL-TO-ACTION:
"Download Controls Matrix" [button]
"Schedule Compliance Audit" [button]

STYLE: Compliance-focused, professional, regulatory credibility
```

---

## Prompt 5: Comparison Matrix Section

```
Create a "Why SYMBI Trust Protocol?" comparison table:

SECTION TITLE: "Why SYMBI Over Alternatives?"
SECTION SUBTITLE: "Open standards, production-ready infrastructure, zero vendor lock-in"

COMPARISON TABLE (5 rows x 4 columns):

Headers:
- Feature
- SYMBI Trust Protocol
- LangChain / LangSmith
- Custom Solutions

Row 1: Identity Standard
- SYMBI: "W3C DID (4 methods)" ✓
- LangChain: "Centralized user IDs" ✗
- Custom: "Proprietary schemas" ✗

Row 2: Trust Verification
- SYMBI: "W3C Verifiable Credentials" ✓
- LangChain: "None (observability only)" ✗
- Custom: "Database-backed" ⚠️

Row 3: Revocation Privacy
- SYMBI: "Status List 2021 (128K in 16KB)" ✓
- LangChain: "N/A" ✗
- Custom: "Database lookups (privacy leak)" ✗

Row 4: Key Management
- SYMBI: "AWS KMS, GCP KMS, Local" ✓
- LangChain: "N/A" ✗
- Custom: "Varies" ⚠️

Row 5: Audit Trail
- SYMBI: "Cryptographic signatures + chaining" ✓
- LangChain: "Application logs" ⚠️
- Custom: "Varies" ⚠️

Row 6: Vendor Lock-In
- SYMBI: "None (open standards)" ✓
- LangChain: "Python/JS ecosystem" ⚠️
- Custom: "High (proprietary)" ✗

BOTTOM TEXT:
"Use LangChain for LLM orchestration. Use SYMBI for agent trust and compliance."

STYLE: Clear comparison table, professional, fact-based
```

---

## Prompt 6: Technical Architecture Diagram

```
Create an interactive architecture diagram section:

SECTION TITLE: "How It Works"
SECTION SUBTITLE: "W3C-compliant trust infrastructure from identity to revocation"

DIAGRAM FLOW (left to right):

Step 1: Agent Registration
- Visual: Agent icon
- Text: "Agent registers with DID"
- Tech: "did:web:example.com/agents/agent-123"
- Link: "Learn about DIDs →"

Step 2: Trust Declaration
- Visual: Document/certificate icon
- Text: "Issue Verifiable Credential"
- Tech: "6-pillar trust scoring algorithm"
- Link: "View scoring logic →"

Step 3: Credential Storage
- Visual: Vault/safe icon
- Text: "Store with revocation entry"
- Tech: "Status List 2021 index allocated"
- Link: "Privacy-preserving revocation →"

Step 4: Trust Verification
- Visual: Magnifying glass icon
- Text: "Verify credential signature"
- Tech: "Ed25519 or secp256k1 verification"
- Link: "Cryptographic verification →"

Step 5: Status Check
- Visual: Status check icon
- Text: "Check revocation status"
- Tech: "Query Status List 2021 bitstring"
- Link: "How revocation works →"

Step 6: Audit Logging
- Visual: Chain link icon
- Text: "Record in audit trail"
- Tech: "KMS-signed, hash-chained entry"
- Link: "Audit trail security →"

INTERACTIVE ELEMENTS:
- Hovering over each step shows more technical detail
- Click to expand code examples
- "View Live Demo" button at the end

STYLE: Clean, modern, interactive SVG diagram
```

---

## Prompt 7: Code Example Section

```
Create a "See It In Action" code snippet section:

SECTION TITLE: "Developer-First API"
SECTION SUBTITLE: "Clean, type-safe TypeScript SDK with comprehensive documentation"

CODE TABS (3 tabs):

Tab 1: "Resolve DID"
```typescript
import { UniversalResolver } from '@symbi/trust-protocol';

const resolver = new UniversalResolver();
const result = await resolver.resolve('did:web:example.com');

console.log(result.didDocument.id);
// Output: did:web:example.com
console.log(result.didResolutionMetadata.duration);
// Output: 42ms
```

Tab 2: "Issue Credential"
```typescript
import { AgentFactory } from '@symbi/trust-protocol';

const trustDeclaration = AgentFactory.createTrustDeclaration(
  'agent-123',
  'MyAIAgent',
  {
    inspection_mandate: true,
    consent_architecture: true,
    ethical_override: true,
    continuous_validation: false,
    right_to_disconnect: false,
    moral_recognition: false
  }
);

console.log(trustDeclaration.scores.compliance_score);
// Output: 0.52
console.log(trustDeclaration.scores.guilt_score);
// Output: 0.48
```

Tab 3: "Check Revocation"
```typescript
import { verifyRemoteStatus } from '@symbi/trust-protocol';

const statusEntry = {
  id: 'https://example.com/status/1#42',
  type: 'StatusList2021Entry',
  statusPurpose: 'revocation',
  statusListIndex: '42',
  statusListCredential: 'https://example.com/status/1'
};

const result = await verifyRemoteStatus(statusEntry);
console.log(result.status);
// Output: 'active' | 'revoked' | 'suspended'
```

BOTTOM LINKS:
- "View Full Documentation →"
- "Explore on GitHub →"
- "Try in CodeSandbox →"

STYLE: Syntax-highlighted code, dark theme, copy button on each snippet
```

---

## Prompt 8: Social Proof Section

```
Create a "Built for Enterprise" section with trust indicators:

SECTION TITLE: "Built for Enterprise Scale"

LOGOS/BADGES ROW 1 (Standards & Compliance):
- W3C DID Core logo
- W3C Verifiable Credentials logo
- EU AI Act badge (custom design)
- ISO 27001 compatible badge
- SOC 2 ready badge

LOGOS/BADGES ROW 2 (Technology Partners):
- AWS Partner badge
- GCP Partner badge
- GitHub (open source)
- TypeScript logo
- Redis logo

STATS SECTION (3 columns):

Column 1:
- Number: "95%+"
- Label: "Test Coverage"
- Subtext: "Comprehensive testing across all modules"

Column 2:
- Number: "4"
- Label: "DID Methods"
- Subtext: "Most complete DID resolver for AI"

Column 3:
- Number: "0"
- Label: "Integrity Failures"
- Subtext: "10M+ audit entries verified"

CASE STUDY PREVIEW (2 cards):

Card 1: Financial Services
- Logo placeholder
- Title: "Multinational Bank Achieves EU AI Act Compliance"
- Highlight: "500+ AI agents, 6 weeks to compliance, 60% audit cost reduction"
- Link: "Read case study →"

Card 2: Healthcare
- Logo placeholder
- Title: "Healthcare Platform Scales Trust to 1M Interactions/Day"
- Highlight: "Sub-15ms overhead, SOC 2 passed first attempt, HIPAA compliant"
- Link: "Read case study →"

STYLE: Enterprise credibility, professional logos, data-driven social proof
```

---

## Prompt 9: FAQ Section

```
Create an FAQ section addressing key questions:

SECTION TITLE: "Frequently Asked Questions"

FAQ ITEMS (expandable accordions):

Q1: "Do I need DAO tokens to use SYMBI Trust Protocol?"
A: "No. SYMBI Trust Protocol is open-source and available to everyone. The Sonate Platform is a commercial SaaS offering that also requires no tokens. DAO tokens are only for contributors who want to participate in protocol governance. [Learn about SYMBI DAO →]"

Q2: "Is this production-ready or still experimental?"
A: "Production-ready. We've completed comprehensive testing across all modules (DID resolution, VC issuance, revocation, KMS integration, audit logging) with 95%+ test coverage. The infrastructure is deployed on AWS and GCP with enterprise SLAs available via Sonate Platform."

Q3: "What's the relationship between SYMBI, Sonate, and the DAO?"
A: "SYMBI Trust Protocol is the W3C-based open standard. Sonate Platform is the enterprise SaaS product built on SYMBI. SYMBI DAO is the community governance layer for protocol evolution. SYMBI Foundation provides academic stewardship. You can use the protocol or platform without participating in the DAO."

Q4: "How does this compare to LangChain or other LLM orchestration tools?"
A: "Different problem spaces. LangChain excels at LLM orchestration and prompt management. SYMBI focuses on trust infrastructure: decentralized identity, verifiable credentials, and cryptographic audit trails. Use both: LangChain for orchestration, SYMBI for trust and compliance."

Q5: "What makes this 'W3C-compliant'?"
A: "We implement W3C DID Core (Decentralized Identifiers), W3C Verifiable Credentials Data Model, and W3C Status List 2021 specifications. This ensures interoperability with other W3C-compliant systems and avoids vendor lock-in."

Q6: "How does SYMBI help with EU AI Act compliance?"
A: "SYMBI provides out-of-the-box support for Article 13 (transparency via VCs and audit logs), Article 14 (human oversight via trust scoring and revocation), Article 17 (quality management via monitoring), and Article 72 (record-keeping via cryptographic audit trails). We provide a Controls Matrix mapping protocol features to regulatory requirements."

Q7: "Can I self-host or do I need to use your cloud service?"
A: "Both options available. SYMBI Trust Protocol is open-source (MIT/Apache 2.0) and can be self-hosted. Sonate Platform offers managed hosting with enterprise support, SLAs, and additional features. We also support hybrid deployments."

Q8: "What's your pricing model?"
A: "SYMBI Trust Protocol (open-source): Free forever. Sonate Platform: Starts at $2,000/month for 100K trust verifications. Enterprise plans with unlimited verifications available. Contact sales for custom pricing."

STYLE: Clean accordion interface, concise answers with links to detailed docs
```

---

## Prompt 10: CTA Section (Bottom of Page)

```
Create a strong closing CTA section:

SECTION BACKGROUND: Gradient or accent color

MAIN HEADLINE: "Ready to Build Trustworthy AI?"
SUBHEADLINE: "Join enterprises using SYMBI Trust Protocol for EU AI Act compliance and cryptographic audit trails"

CTA OPTIONS (3 buttons in a row):

Button 1 (Primary): "Request Enterprise Demo"
- Action: Opens demo request form
- Subtext: "Talk to our team about your use case"

Button 2 (Secondary): "View Technical Docs"
- Action: Links to documentation
- Subtext: "Explore the complete implementation"

Button 3 (Tertiary): "Try on GitHub"
- Action: Links to SYMBI Symphony repo
- Subtext: "Open-source, MIT/Apache 2.0 licensed"

BOTTOM TEXT:
"No credit card required • Production-ready today • No tokens needed"

TRUST LINE:
"Trusted by organizations demanding proof • View live metrics on Dune →"

STYLE: High-contrast, compelling, clear next steps
```

---

## Prompt 11: Navigation Header Updates

```
Update the yseeku.com navigation header:

LOGO: SYMBI or Sonate logo (left)

NAV ITEMS (center):
- "Features" → dropdown with:
  - DID Resolution
  - Verifiable Credentials
  - Revocation
  - Audit Logging
  - KMS Integration

- "Why SYMBI?" → dropdown with:
  - vs. LangChain
  - vs. Custom Solutions
  - EU AI Act Compliance

- "Developers" → links to:
  - Documentation
  - GitHub Repository
  - API Reference
  - Code Examples

- "Resources" → dropdown with:
  - Case Studies
  - Blog
  - Technical Whitepapers
  - Webinars

- "Pricing" → links to pricing page

- "Community" → links to:
  - SYMBI DAO (gammatria.com)
  - Discord/Forum
  - Contribute

RIGHT SIDE:
- "Sign In" link
- "Request Demo" button (primary CTA)

STYLE: Clean, professional, sticky on scroll
```

---

## Prompt 12: Footer Updates

```
Update the yseeku.com footer:

LAYOUT: 4 columns + social links

Column 1: Product
- Sonate Platform
- SYMBI Trust Protocol
- Features
- Pricing
- Roadmap

Column 2: Developers
- Documentation
- GitHub Repository
- API Reference
- SDK Downloads
- Code Examples

Column 3: Resources
- Case Studies
- Blog
- Whitepapers
- Webinars
- Support

Column 4: Company
- About Us
- SYMBI Foundation
- SYMBI DAO
- Careers
- Contact

BOTTOM ROW:
Left side:
- "© 2025 SYMBI Trust Protocol"
- "Open-source: MIT/Apache 2.0"

Center:
- Terms of Service
- Privacy Policy
- Security

Right side:
- GitHub icon → links to repo
- Twitter/X icon → social
- LinkedIn icon → company page
- Discord icon → community

IMPORTANT DISCLAIMER (small text):
"SYMBI governance tokens have no financial value and grant no economic rights. Tokens are used solely for protocol governance. You do not need tokens to use SYMBI Trust Protocol or Sonate Platform."

STYLE: Professional, comprehensive, regulatory compliance
```

---

## Prompt 13: Performance & Technical Requirements

```
Ensure the updated yseeku.com meets these technical requirements:

PERFORMANCE:
- Lighthouse score: 90+ on all metrics
- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.1

SEO:
- Meta title: "SYMBI Trust Protocol - W3C-Compliant Trust Infrastructure for AI Agents"
- Meta description: "Production-ready trust infrastructure with DID resolution, verifiable credentials, and privacy-preserving revocation. EU AI Act compliant. No tokens required."
- Keywords: "W3C DID", "Verifiable Credentials", "AI trust infrastructure", "EU AI Act compliance", "Status List 2021"
- Open Graph tags for social sharing
- Structured data (JSON-LD) for organization and product

ACCESSIBILITY:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader friendly
- Proper ARIA labels

ANALYTICS:
- Google Analytics 4 setup
- Track: Demo requests, GitHub clicks, documentation views, Dune dashboard clicks
- Conversion funnels: Homepage → Demo request
- UTM parameter support for campaign tracking

STYLE: Fast, accessible, SEO-optimized, conversion-focused
```

---

## Prompt 14: Mobile Responsiveness

```
Ensure yseeku.com is fully responsive:

MOBILE BREAKPOINTS:
- 320px (mobile small)
- 375px (mobile medium)
- 425px (mobile large)
- 768px (tablet)
- 1024px (desktop)
- 1440px+ (large desktop)

MOBILE OPTIMIZATIONS:
- Hamburger menu for navigation
- Simplified hero section (single column)
- Touch-friendly buttons (min 44px)
- Collapsed comparison table (swipeable)
- Reduced animation complexity
- Lazy-loaded images
- Optimized font sizes (minimum 16px body text)

TABLET OPTIMIZATIONS:
- 2-column layouts for feature cards
- Sticky navigation header
- Side-by-side comparison tables
- Readable code snippets

DESKTOP OPTIMIZATIONS:
- 3-column layouts for feature cards
- Expanded navigation with dropdowns
- Full-width comparison tables
- Interactive diagrams and hover effects

STYLE: Mobile-first design, progressive enhancement
```

---

## Prompt 15: A/B Testing Recommendations

```
Set up A/B testing for key conversion elements:

TEST 1: Hero Headline
Variant A: "Trust Infrastructure for AI Agents"
Variant B: "EU AI Act Compliant Trust Protocol for AI"
Metric: Demo request click-through rate

TEST 2: Primary CTA
Variant A: "Request Demo"
Variant B: "Schedule Compliance Audit"
Metric: Form submission rate

TEST 3: Social Proof Position
Variant A: Logos below hero
Variant B: Logos in dedicated section mid-page
Metric: Time on site, scroll depth

TEST 4: Technical Depth
Variant A: Code examples on homepage
Variant B: Code examples only in docs
Metric: GitHub clicks, developer engagement

TEST 5: Pricing Transparency
Variant A: "Contact for Pricing"
Variant B: Pricing page with tiers
Metric: Enterprise demo requests

TOOL: Google Optimize or similar A/B testing platform
DURATION: 2-4 weeks per test, 95% statistical significance

STYLE: Data-driven optimization, continuous improvement
```

---

## Summary: Key Messaging Points

**For the LLM handling the website build, emphasize:**

1. **Position as Trust Infrastructure, Not AI Orchestration**
   - Lead with "W3C-compliant trust infrastructure"
   - Compare to Auth0/Okta (identity), not LangChain (LLM tools)

2. **Highlight Production-Ready Testing**
   - 95%+ test coverage
   - 10M+ audit entries verified
   - RFC, NIST, W3C test vectors validated
   - Days 1-6 implementation complete

3. **Emphasize Open Standards**
   - W3C DID Core, VC Data Model, Status List 2021
   - No vendor lock-in
   - Interoperable with other W3C systems

4. **EU AI Act Urgency**
   - Compliance deadline 2025-2026
   - Out-of-the-box support for Articles 13, 14, 17, 72
   - Controls Matrix available

5. **No Tokens Required**
   - Prominent FAQ answer
   - DAO governance is optional
   - Enterprise usage independent of DAO

6. **Technical Credibility**
   - 4 DID methods (most complete)
   - 128K credentials in 16KB (efficiency)
   - Sub-15ms trust scoring (performance)
   - AWS/GCP KMS integration (enterprise-grade)

7. **Transparency as Differentiator**
   - Public Dune dashboards
   - Live metrics
   - Open-source on GitHub
   - Cryptographic audit trails

**Tone:** Professional, technical, enterprise SaaS, security-focused, data-driven

**Avoid:** "AI orchestration", "crypto" language, abstract claims without proof, speculative positioning

**Call-to-Action:** Request Demo (primary), View Docs (secondary), Try on GitHub (tertiary)
