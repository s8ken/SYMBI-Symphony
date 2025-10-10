# 🚀 SYMBI GO-LIVE PLAYBOOK - Railway Integration 4
**Production Deployment Checklist & Model Configuration**

---

## 📋 FINAL MODEL MAP - /api/v1/models

```json
{
  "data": [
    { "id": "symbi-intel-analyst-001",   "object":"model", "description":"Intelligence analysis", "context_length": 128000, "max_output_tokens": 8192, "tier":"Advanced" },
    { "id": "symbi-cyber-sentinel-001",  "object":"model", "description":"Cybersecurity",         "context_length": 128000, "max_output_tokens": 8192, "tier":"Advanced" },
    { "id": "symbi-field-commander-001", "object":"model", "description":"Strategy & ops",        "context_length": 128000, "max_output_tokens": 8192, "tier":"Frontier" },
    { "id": "blackbox-alpha",            "object":"model", "description":"Premium reasoning",     "context_length": 200000, "max_output_tokens": 8192, "tier":"Frontier" },
    { "id": "blackbox-beta",             "object":"model", "description":"Balanced performance",  "context_length": 128000, "max_output_tokens": 8192, "tier":"Advanced" },
    { "id": "blackbox-ai-pro",           "object":"model", "description":"Enterprise-grade",      "context_length": 128000, "max_output_tokens": 8192, "tier":"Advanced" },
    { "id": "blackbox-ai-standard",      "object":"model", "description":"General purpose",       "context_length": 128000, "max_output_tokens": 8192, "tier":"Standard" },
    { "id": "blackbox-ai-fast",          "object":"model", "description":"Low latency",           "context_length":  64000, "max_output_tokens": 4096, "tier":"Standard" }
  ]
}
```

**Billing Tiers (SU):**
- Standard = 1×
- Advanced = 5×  
- Frontier = 10×

---

## 🔧 ENVIRONMENT CONFIGURATION

### Railway Service (Blackbox/bus)
```bash
# Required
BLACKBOX_API_KEY=***                  # Blackbox API authentication
POLICY_ML_ENABLED=true
POLICY_ML_MODE=baseline
BUDGET_TOTAL_USD=1000                 # Nightly optimizer budget

# Observability
SLACK_ALERT_WEBHOOK_URL=***           # Optional alerts
OTEL_SERVICE_NAME=symbi-policy-ml     # Optional OTEL integration
```

### V0 Service (Public API)
```bash
BLACKBOX_MODE=bus
BLACKBOX_BASE_URL=https://<railway-app>.up.railway.app/api/agents
BLACKBOX_TOKEN=***                    # Bus authentication
SITE_URL=https://v0-symbi-railway-integration.vercel.app
STATUS_MODEL=symbi-intel-analyst-001
```

**CORS Configuration:**
- Allow: `https://symbi.world`
- Allow: `https://v0-symbi-railway-integration.vercel.app`

---

## 🚀 DEPLOYMENT STEPS

### 1. Deploy Railway Service
```bash
cd app/symbi-railway-integration-4
railway up
```

### 2. Update V0 Environment
- Update `BLACKBOX_BASE_URL` with Railway service URL
- Redeploy Vercel application

---

## ✅ SMOKE TESTS

### Models Endpoint
```bash
curl -s https://v0-symbi-railway-integration.vercel.app/api/v1/models | jq '.data[].id'
```

### Non-Stream Chat
```bash
curl -s https://v0-symbi-railway-integration.vercel.app/api/v1/chat/completions \
 -H 'Content-Type: application/json' \
 -d '{ "model":"blackbox-ai-standard", "messages":[{"role":"user","content":"Give me 2 bullets on SYMBI."}] }' \
 | jq '.usage'
```

### Stream Chat (OpenAI SSE)
```bash
curl -N https://v0-symbi-railway-integration.vercel.app/api/v1/chat/completions \
 -H 'Content-Type: application/json' \
 -d '{ "model":"blackbox-alpha", "stream": true, "messages":[{"role":"user","content":"Stream 3 bullets."}] }'
```

### Health Checks
```bash
curl -s https://v0-symbi-railway-integration.vercel.app/api/agents/health | jq
curl -s https://v0-symbi-railway-integration.vercel.app/api/status | jq '.ok, .checks'
```

### Metrics
```bash
curl -s https://<railway-app>.up.railway.app/api/metrics | head
```

---

## 🛡️ POLICY & COST GOVERNANCE

### Import Path Verification
```typescript
// lib/services/enhanced-policy-engine.ts
export * from './enhanced-policy-engine-complete';
```

### Budget Testing
```bash
# Set $1 budget for intelligence_analyst
# Send ~$1.20 estimated request
# Expect: reject with reason "budget_exhausted:agent"
```

---

## 🔍 OPENROUTER COMPLIANCE CHECKLIST

- [ ] `/api/v1/models` includes: id, description, context_length, max_output_tokens
- [ ] `/api/v1/chat/completions` returns usage for stream and non-stream
- [ ] Streaming sends delta chunks + final usage event + [DONE]
- [ ] `/api/openapi.json` present
- [ ] `/health` and `/api/agents/health` live
- [ ] Privacy links: https://symbi.world/legal/privacy, https://symbi.world/legal/data

---

## 📊 OBSERVABILITY

### Metrics Endpoint
- Railway service exports `/api/metrics`
- Scrape with Grafana Cloud/Prometheus

### Alerts
- POST to `/api/ops/alerts`
- Fan-out to Slack via `SLACK_ALERT_WEBHOOK_URL`

### Structured Logs
- `ml.predict.result`
- `ml.anomaly.result`
- `policy.alert`
- `policy.block`

---

## 🔄 ROLLBACK PLAN

### Railway
- Roll back via "Deployments" tab in Railway dashboard

### V0
- Toggle `BLACKBOX_MODE=upstream` to bypass bus temporarily
- Set `perAgentMonthlyBudgetUSD` high during rollback

---

## 👥 TEAM HANDOFF

### Blackbox Team
- [ ] Ensure `/api/agents/send` supports `stream:true`
- [ ] Verify EnhancedPolicyEngine is active export
- [ ] Confirm `/api/metrics` exposes counters/histograms

### V0 Team
- [ ] Update `BLACKBOX_BASE_URL` to Railway URL
- [ ] Redeploy and run all smoke tests
- [ ] Screenshot `/status` showing green

---

## 🎯 SUCCESS CRITERIA

- [ ] `/status` shows PASS for Models, Health, Chat
- [ ] All 8 models list correctly
- [ ] 5 Blackbox models respond with usage populated
- [ ] Stream path verified for at least one Blackbox model
- [ ] Metrics endpoint returns non-zero counters
- [ ] Budget gate test passes (blocked with clear reason)

---

**🟢 STATUS: READY FOR PRODUCTION DEPLOYMENT**
