# SYMBI Ecosystem Integration Plan

## Overview

This document outlines the integration plan for the complete SYMBI ecosystem, connecting AgentVerse, tactical-command-interface, SYMBI-Synergy, and SYMBI-Resonate into a unified AI collaboration platform with trust verification and quality measurement.

## System Architecture

### Current Components

1. **AgentVerse** (Current Directory: `/Users/admin/AgentVerse`)
   - Multi-agent collaboration platform
   - Gammatria agent with RAG capabilities
   - Trust receipt generation and verification
   - Integration with tactical-command-interface

2. **tactical-command-interface** (Directory: `/Users/admin/tactical-command-interface`)
   - Agent orchestration platform
   - Task distribution and coordination
   - Communication hub for multi-agent workflows

3. **SYMBI-Synergy** (Directory: `/Users/admin/SYMBI-SYNERGY-main`)
   - Enterprise AI trust platform
   - Cryptographic proof for AI decisions
   - Trust receipt validation and storage
   - Compliance dashboards and audit trails

4. **SYMBI-Resonate** (Directory: `/Users/admin/SYMBI-Resonate`)
   - Quality measurement system
   - 5-dimension SYMBI framework assessment
   - Academic evaluation tools
   - Performance analytics

## Phase 4: End-to-End Workflow (Practical Implementation)

### Workflow Architecture
1. **User Request** → tactical-command-interface
2. **AgentVerse** (Hosted SYMBI) → returns intent JSON + receipt_stub + next
3. **AgentVerse** calls executor (Vercel) with HMAC
4. **Executor** runs tool (rag.query → Weaviate) → returns output + signed receipt
5. **AgentVerse** forwards receipt to Synergy (JWT) → valid + compliance score
6. **AgentVerse** sends final answer + calls Resonate for quality scoring (async)
7. **Dashboard** shows: answer, signed trust receipt (valid), quality scores

## Integration Points

### 1. AgentVerse ↔ tactical-command-interface
**Status**: Partially implemented
**Integration Method**: HTTP API calls
**Key Files**:
- `AgentVerse/gammatria-agent.py` (tactical_rag_query function)
- `AgentVerse/trust_receipt_test.py` (cross-system verification)

**Current Implementation**:
```python
def tactical_rag_query(query, context=""):
    url = "http://localhost:3001/api/rag/query"
    # Makes HTTP request to tactical-command-interface
```

### 2. AgentVerse ↔ SYMBI-Synergy
**Status**: Ready for implementation
**Integration Method**: Raw Executor Receipt Exchange + JWT Authentication

#### Raw Receipt Submission (Updated)
```python
def submit_executor_receipt_to_synergy(raw_receipt):
    """Submit raw executor receipt to SYMBI-Synergy for validation and storage"""
    url = "http://localhost:5000/api/trust/receipts"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SYNERGY_JWT}"
    }
    
    # Submit raw receipt without field remapping
    response = requests.post(url, json=raw_receipt, headers=headers)
    return response.json()
```

#### Receipt Retrieval
```python
def get_receipt_validation_result(receipt_id):
    """Get stored receipt and validation result from SYMBI-Synergy"""
    url = f"http://localhost:5000/api/trust/receipts/{receipt_id}"
    headers = {"Authorization": f"Bearer {SYNERGY_JWT}"}
    
    response = requests.get(url, headers=headers)
    return response.json()  # Returns stored receipt + validation result
```

### 3. AgentVerse ↔ SYMBI-Resonate
**Status**: Ready for implementation
**Integration Method**: Content Assessment API with Receipt Tracking

#### Quality Assessment Integration (Updated)
```python
def assess_interaction_quality(interaction_data, receipt_id=None):
    """Submit interaction to SYMBI-Resonate for quality assessment"""
    url = "http://localhost:3000/api/assess"
    headers = {"Content-Type": "application/json"}
    
    assessment_input = {
        "content": interaction_data["content"],
        "metadata": {
            "source": "AgentVerse",
            "agent_id": interaction_data["agent_id"],
            "context": interaction_data["context"],
            "timestamp": interaction_data["timestamp"],
            "receipt_id": receipt_id  # Link to trust receipt
        }
    }
    
    response = requests.post(url, json=assessment_input, headers=headers)
    return response.json()
```

### 4. SYMBI-Synergy ↔ SYMBI-Resonate
**Status**: Linked via receipt_id
**Integration Method**: Assessment Data Exchange with Trust Receipt Reference
**Purpose**: Link trust verification with quality measurement through receipt_id

## Implementation Phases

### Phase 1: Core Infrastructure Setup
**Duration**: 1-2 days
**Priority**: High

1. **Start SYMBI-Synergy Backend**
   ```bash
   cd /Users/admin/SYMBI-SYNERGY-main/backend
   npm install
   npm start
   ```

2. **Start SYMBI-Resonate Frontend**
   ```bash
   cd /Users/admin/SYMBI-Resonate
   npm install
   npm run dev
   ```

3. **Verify tactical-command-interface**
   ```bash
   cd /Users/admin/tactical-command-interface
   npm start
   ```

### Phase 2: Trust Receipt Integration
**Duration**: 2-3 days
**Priority**: High

1. **Extend AgentVerse Trust Receipt System**
   - Add SYMBI-Synergy API integration
   - Implement trust declaration submission
   - Add compliance score calculation

2. **Configure SYMBI-Synergy**
   - Set up MongoDB for trust storage
   - Configure JWT authentication
   - Enable CORS for AgentVerse integration

3. **Test Trust Flow**
   - Generate trust receipt in AgentVerse
   - Submit to SYMBI-Synergy
   - Verify storage and compliance scoring

### Phase 3: Quality Assessment Integration
**Duration**: 2-3 days
**Priority**: Medium

1. **Integrate SYMBI-Resonate Assessment**
   - Add quality assessment calls to AgentVerse
   - Implement 5-dimension scoring
   - Store assessment results

2. **Create Assessment Dashboard**
   - Display quality metrics in AgentVerse
   - Show SYMBI framework scores
   - Provide improvement recommendations

### Phase 4: End-to-End Workflow
**Duration**: 3-4 days
**Priority**: Medium

1. **Complete Workflow Implementation**
   - Agent receives task via tactical-command-interface
   - Generates response with trust receipt
   - Submits to SYMBI-Synergy for trust verification
   - Submits to SYMBI-Resonate for quality assessment
   - Returns verified, assessed response

2. **Dashboard Integration**
   - Unified view across all systems
   - Real-time trust and quality metrics
   - Audit trail visualization

## Configuration Requirements

### Environment Variables

#### SYMBI-Synergy (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/symbi-synergy
JWT_SECRET=your-jwt-secret
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your-openai-key
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Receipt Verification (Updated)
RECEIPT_PUBKEY_HEX=<ed25519 public key hex>

# JWT Configuration (Updated)
JWT_ISS=agentverse
JWT_AUD=synergy
```

#### SYMBI-Resonate (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

#### AgentVerse (config.py)
```python
SYMBI_SYNERGY_URL = "http://localhost:5000"
SYMBI_RESONATE_URL = "http://localhost:3000"
TACTICAL_INTERFACE_URL = "http://localhost:3001"
TRUST_RECEIPT_ENABLED = True
QUALITY_ASSESSMENT_ENABLED = True

# Updated Configuration
SYNERGY_JWT = "<short-lived token or service JWT>"
EXEC_BASE = "https://symbi-exec-chdwjrc6f-ycq.vercel.app"
```

## API Endpoints

### SYMBI-Synergy Integration (Updated)
- `POST /api/trust/receipts` - Submit raw executor receipt for validation
- `GET /api/trust/receipts/{id}` - Retrieve stored receipt + validation result
- `GET /api/health` - Health check endpoint
- `GET /api/metrics` - Prometheus-style metrics

### SYMBI-Resonate Integration
- `POST /api/assess` - Submit content for assessment
- `GET /api/assess/{id}` - Retrieve assessment results
- `GET /api/metrics` - Get quality metrics dashboard

### tactical-command-interface Integration
- `POST /api/rag/query` - RAG query endpoint
- `GET /api/health` - Health check endpoint

## Ready-to-Run Tests

### 1. SYMBI-Synergy Health Check
```bash
curl -s http://localhost:5000/api/health | jq .
```

### 2. Submit Real Executor Receipt
```bash
# First, get a real receipt from /api/exec response
curl -sX POST http://localhost:5000/api/trust/receipts \
  -H "Authorization: Bearer $SYNERGY_JWT" \
  -H "Content-Type: application/json" \
  -d @receipt.json | jq .
```

### 3. SYMBI-Resonate Assessment Test
```bash
curl -sX POST http://localhost:3000/api/assess \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test answer",
    "metadata": {
      "source": "AgentVerse",
      "agent_id": "SYMBI",
      "context": "symbi",
      "timestamp": "2025-01-04T11:05:00Z",
      "receipt_id": "rcpt_123"
    }
  }' | jq .
```

### 4. tactical-command-interface RAG Query
```bash
curl -sX POST http://localhost:3001/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is SYMBI?",
    "context": "framework"
  }' | jq .
```

## Security Considerations (Updated)

1. **Authentication**: JWT tokens for API access with proper issuer/audience validation
2. **Encryption**: HMAC-SHA256 for trust receipts with ed25519 signature verification
3. **CORS**: Proper origin validation (avoid wildcard in production)
4. **Rate Limiting**: 
   - Rate-limit `POST /api/trust/receipts` by IP + JWT sub
   - Implement exponential backoff for failed requests
5. **Input Validation**: Sanitize all inputs, validate receipt signatures
6. **Audit Logging**: 
   - Log task_id, receipt_id, validation results
   - **DO NOT log raw content** (PII protection)
   - Log compliance scores and reasons only
7. **Secret Management**: Use environment variables, rotate JWT secrets regularly
8. **Network Security**: Use HTTPS in production, validate SSL certificates

## Monitoring and Observability (Updated)

### Service-Level Monitoring

#### Executor (Vercel)
```javascript
// Log format for executor
console.log(JSON.stringify({
  tool: "rag.query",
  latency_ms: responseTime,
  receipt_id: receiptId,
  timestamp: new Date().toISOString(),
  success: true
}));
```

#### SYMBI-Synergy
```javascript
// Log format for synergy
console.log(JSON.stringify({
  receipt_id: receiptId,
  valid: validationResult,
  compliance_score: score,
  reason: validationReason,
  timestamp: new Date().toISOString()
}));
```

#### SYMBI-Resonate
```javascript
// Log format for resonate
console.log(JSON.stringify({
  assessment_id: assessmentId,
  verdict: overallVerdict,
  mean_score: averageScore,
  dimensions: dimensionScores,
  timestamp: new Date().toISOString()
}));
```

### Metrics Endpoints

#### /metrics Implementation (Prometheus-style)
```javascript
// Simple metrics endpoint for each service
app.get('/metrics', (req, res) => {
  const metrics = {
    requests_total: requestCounter,
    requests_success: successCounter,
    requests_error: errorCounter,
    response_time_avg: averageResponseTime,
    active_connections: activeConnections
  };
  res.json(metrics);
});
```

### Dashboard Setup (Next.js)
```javascript
// Simple monitoring dashboard
const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({});
  
  useEffect(() => {
    const fetchMetrics = async () => {
      const [synergy, resonate, tactical] = await Promise.all([
        fetch('http://localhost:5000/metrics').then(r => r.json()),
        fetch('http://localhost:3000/metrics').then(r => r.json()),
        fetch('http://localhost:3001/metrics').then(r => r.json())
      ]);
      setMetrics({ synergy, resonate, tactical });
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);
  
  return <MetricsDisplay metrics={metrics} />;
};
```

## Known Pitfalls to Avoid

1. **Weaviate Schema Issues**
   - Mismatched class names (VaultDoc vs VaultDocs) → zero results
   - Mixing auto-vectorizer and BYO embeddings → inconsistent distances
   - Always verify schema alignment before ingestion

2. **Network Configuration**
   - Using localhost inside Hosted agents → timeouts when deployed
   - Use proper service URLs in production environment
   - Test connectivity between all services

3. **Receipt Handling**
   - Transforming the receipt payload (renaming keys) → signature validation fails
   - Always submit raw executor receipts without modification
   - Verify ed25519 signature validation is working

4. **CORS Configuration**
   - CORS set too wide → browsers block or you open risk surface
   - Use specific origins, avoid wildcards in production
   - Test cross-origin requests thoroughly

5. **JWT Token Management**
   - Expired tokens → authentication failures
   - Mismatched issuer/audience → validation errors
   - Implement proper token refresh mechanisms

## Green-Light Checklist (Phase 1-2)

### ✅ Weaviate Configuration
- [ ] Weaviate has VaultDoc class with `vectorizer: none`
- [ ] Ingest batches include `vector=...` field
- [ ] Schema alignment verified with `/v1/schema` response

### ✅ RAG System
- [ ] `/api/rag/retrieve` returns real matches from your Vault
- [ ] Query responses include relevant context
- [ ] Vector similarity scores are reasonable (>0.7 for good matches)

### ✅ Executor Integration
- [ ] `/api/exec` returns signed receipts
- [ ] Receipt signatures validate with ed25519 public key
- [ ] HMAC authentication working between AgentVerse and Executor

### ✅ Trust Receipt Flow
- [ ] AgentVerse submits executor receipts to Synergy
- [ ] Synergy returns `{ valid: true }` for valid receipts
- [ ] Compliance scores calculated and stored

### ✅ Dashboard Integration
- [ ] Dashboard shows: answer, receipt validity, basic compliance score
- [ ] Real-time updates working
- [ ] Error states handled gracefully

### ✅ Health Checks
- [ ] All services respond to `/api/health`
- [ ] Cross-service communication verified
- [ ] Monitoring endpoints accessible

## Validation Commands

### Check Weaviate Schema
```bash
curl -s http://localhost:8080/v1/schema | jq '.classes[] | select(.class=="VaultDoc")'
```

### Verify Executor Receipt Format
```bash
curl -s https://symbi-exec-chdwjrc6f-ycq.vercel.app/api/exec \
  -H "Content-Type: application/json" \
  -d '{"tool":"rag.query","params":{"query":"test"}}' | jq .
```

### Test End-to-End Flow
```bash
# 1. Query tactical-command-interface
# 2. Get executor receipt
# 3. Submit to Synergy
# 4. Verify validation
# 5. Submit to Resonate
# 6. Check dashboard
```

---

*This integration plan provides a roadmap for creating a unified SYMBI ecosystem that combines multi-agent collaboration, trust verification, and quality measurement into a cohesive platform for AI-human collaboration.*