# 🎯 Golden Path: Trust Protocol in 60 Seconds

> **The sales motion**: From API call → cryptographic receipt → verification proof in under 60 seconds

## 🚀 Quick Demo

**Live Demo**: [symbi-synergy-pa9k82n5m-ycq.vercel.app](https://symbi-synergy-pa9k82n5m-ycq.vercel.app)  
**Test Credentials**: `demo@symbi-trust.com` / `demo123`

---

## 📋 Step 1: Authenticate & Get Token

```bash
# Get demo authentication token
curl -X POST https://symbi-synergy-pa9k82n5m-ycq.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@symbi-trust.com",
    "password": "demo123"
  }'

# Response includes JWT token
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

**🎯 Value**: Secure authentication with enterprise-grade JWT

---

## 🤖 Step 2: Generate AI Response with Trust Receipt

```bash
# Make AI request with trust protocol
export TOKEN="your_jwt_token_here"

curl -X POST https://symbi-synergy-pa9k82n5m-ycq.vercel.app/api/llm/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain the EU AI Act compliance requirements for enterprise AI",
    "provider": "openai",
    "model": "gpt-4o",
    "includeReceipt": true
  }'
```

**Response with Cryptographic Receipt:**
```json
{
  "success": true,
  "data": {
    "response": "The EU AI Act requires enterprises to...",
    "metadata": {
      "model": "gpt-4o",
      "provider": "openai",
      "tokens": 156,
      "cost": 0.002,
      "responseTime": 1847
    },
    "trustReceipt": {
      "eventId": "evt_2024120301234567",
      "timestamp": "2024-12-03T10:30:45.123Z",
      "contentHash": "a1b2c3d4e5f6789012345678901234567890abcdef",
      "previousHash": "9876543210fedcba9876543210fedcba98765432",
      "signature": "3045022100d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0...",
      "publicKey": "04a1b2c3d4e5f6789012345678901234567890ab...",
      "verificationUrl": "/api/trust/verify/evt_2024120301234567"
    }
  }
}
```

**🎯 Value**: Every AI interaction gets immutable cryptographic proof

---

## 🔍 Step 3: Verify Trust Receipt

```bash
# Verify the cryptographic receipt
curl -X GET https://symbi-synergy-pa9k82n5m-ycq.vercel.app/api/trust/verify/evt_2024120301234567 \
  -H "Authorization: Bearer $TOKEN"
```

**Verification Response:**
```json
{
  "success": true,
  "verification": {
    "isValid": true,
    "eventId": "evt_2024120301234567",
    "contentIntegrity": "VERIFIED",
    "signatureValid": true,
    "chainIntegrity": "VERIFIED",
    "trustScore": 0.95,
    "compliance": {
      "biasDetected": false,
      "fairnessScore": 0.92,
      "policyViolations": [],
      "regulatoryFlags": []
    },
    "auditTrail": {
      "created": "2024-12-03T10:30:45.123Z",
      "user": "demo@symbi-trust.com",
      "provider": "openai",
      "model": "gpt-4o",
      "verified": "2024-12-03T10:31:15.456Z"
    }
  }
}
```

**🎯 Value**: One-click verification proves AI interaction authenticity and compliance

---

## 🏆 The Complete Value Proposition

### **Before SYMBI**: 
❌ AI interactions are black boxes  
❌ No audit trail for compliance  
❌ Manual bias detection  
❌ Regulatory exposure ($35M+ fines)

### **After SYMBI**:
✅ **Cryptographic proof** of every AI decision  
✅ **Immutable audit trail** for regulators  
✅ **Real-time bias detection** and scoring  
✅ **Compliance automation** for EU AI Act

---

## 📊 Trust Score Breakdown

```bash
# Get detailed trust analytics
curl -X GET https://symbi-synergy-pa9k82n5m-ycq.vercel.app/api/trust/analytics \
  -H "Authorization: Bearer $TOKEN"
```

**Analytics Response:**
```json
{
  "summary": {
    "totalInteractions": 1247,
    "averageTrustScore": 0.94,
    "complianceRate": 98.2,
    "biasIncidents": 3,
    "costSavings": "$12,450"
  },
  "breakdown": {
    "byProvider": {
      "openai": { "score": 0.95, "interactions": 634 },
      "anthropic": { "score": 0.96, "interactions": 421 },
      "perplexity": { "score": 0.91, "interactions": 192 }
    },
    "riskFactors": {
      "bias": 0.02,
      "hallucination": 0.03,
      "policy": 0.01
    }
  }
}
```

---

## 🎬 Demo Script (Sales/Investor)

**"Let me show you enterprise AI trust in 60 seconds..."**

1. **Authenticate** → "Secure enterprise authentication"
2. **Generate** → "AI response with cryptographic receipt"  
3. **Verify** → "One-click proof of authenticity and compliance"
4. **Analytics** → "Board-ready compliance dashboard"

**Result**: "Every AI decision is now auditable, verifiable, and compliant."

---

## 🔧 Developer Integration

### Node.js SDK Example
```javascript
const symbi = new SymbiClient({
  apiKey: process.env.SYMBI_API_KEY,
  baseUrl: 'https://api.symbi-trust.com'
});

// Generate AI response with trust receipt
const result = await symbi.ai.generate({
  prompt: "Analyze customer sentiment",
  provider: "openai",
  model: "gpt-4o",
  trustLevel: "enterprise" // Automatic receipt generation
});

// Verify trust receipt
const verification = await symbi.trust.verify(result.trustReceipt.eventId);
console.log(`Trust Score: ${verification.trustScore}`);
```

### Python SDK Example
```python
from symbi import SymbiClient

client = SymbiClient(api_key=os.getenv('SYMBI_API_KEY'))

# Generate with trust protocol
response = client.ai.generate(
    prompt="Evaluate loan application risk",
    provider="anthropic",
    model="claude-3-sonnet",
    trust_level="regulatory"
)

# Instant compliance verification
verification = client.trust.verify(response.trust_receipt.event_id)
print(f"Compliance Score: {verification.compliance_score}")
```

---

## 📞 Next Steps

**For Investors**: [Complete pitch deck](INVESTORS.md)  
**For Technical Teams**: [Architecture overview](ARCHITECTURE.md)  
**For Compliance**: [Security policy](../SECURITY.md)  

**Ready to eliminate AI regulatory risk?**  
**Contact**: [stephen@yseeku.com](mailto:stephen@yseeku.com?subject=SYMBI%20Enterprise%20Demo)