# SYMBI Executor Vercel Deployment Guide

## 1. Vercel Project Setup

Create a new Vercel project for the executor/RAG API:

- **Project name**: `symbi-exec`
- **Default domain**: `symbi-exec.vercel.app` (works immediately)
- **Optional custom domain**: Add `exec.symbi.world` later via Vercel → Settings → Domains → Add

## 2. Environment Variables

Configure these in Vercel → Settings → Environment Variables:

```bash
# HMAC shared secret for request verification
SYMBI_SHARED_SECRET=your-hmac-shared-secret

# Ed25519 private key (64-byte hex-expanded)
ED25519_PRIV_HEX=64-byte-hex-expanded-private-key

# OpenAI API key for embeddings
OPENAI_API_KEY=sk-...

# Weaviate configuration
WEAVIATE_HOST=https://<cluster-id>.weaviate.network
WEAVIATE_API_KEY=...

# Base URL for the executor service
BASE_URL=https://symbi-exec.vercel.app
# Or after custom domain mapping:
# BASE_URL=https://exec.symbi.world
```

## 3. Weaviate Setup

### A) Create Weaviate Cloud Cluster
- Choose region close to your users (e.g., Australia or nearby)
- Auth: API Key (recommended)
- Note the HTTP endpoint and API key

### B) Create VaultDoc Collection
Use this curl command to create the schema:

```bash
curl -X POST "$WEAVIATE_HOST/v1/schema" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $WEAVIATE_API_KEY" \
  -d '{
    "classes": [{
      "class": "VaultDoc",
      "description": "Chunks from SYMBI-Vault",
      "vectorizer": "none",
      "properties": [
        {"name":"path","dataType":["text"]},
        {"name":"title","dataType":["text"]},
        {"name":"chunk_index","dataType":["int"]},
        {"name":"content","dataType":["text"]},
        {"name":"metadata","dataType":["text"]}
      ]
    }]
  }'
```

## 4. API Endpoints

The deployment includes two main endpoints:

### `/api/rag/retrieve` (POST)
Weaviate-backed RAG retrieval endpoint.

**Request:**
```json
{
  "q": "search query",
  "top_k": 6
}
```

**Response:**
```json
{
  "matches": [
    {
      "_additional": { "certainty": 0.85, "distance": 0.15, "id": "..." },
      "path": "SYMBI-Vault/...",
      "title": "Document Title",
      "chunk_index": 0,
      "content": "Document content...",
      "metadata": "{\"source\":\"SYMBI-Vault\",...}"
    }
  ]
}
```

### `/api/exec` (POST)
Main executor endpoint for handling intents.

**Request:**
```json
{
  "intent": {
    "type": "rag.query",
    "query": "What's on the partners page?",
    "top_k": 6
  },
  "hmac_signature": "sha256_hmac_of_intent"
}
```

**Response:**
```json
{
  "matches": [...],
  "receipt_stub": {
    "session_id": "uuid",
    "timestamp": "2025-01-25T...",
    "intent_type": "rag.query",
    "query": "...",
    "matches_count": 3,
    "hash_self": "...",
    "signature": "ed25519:..."
  },
  "next": null
}
```

## 5. Hosted Agent Configuration

Update your hosted agents with:

```bash
EXECUTOR_URL=https://symbi-exec.vercel.app/api/exec
# Or with custom domain:
# EXECUTOR_URL=https://exec.symbi.world/api/exec
```

## 6. Quick Verification

Test the complete pipeline:

```bash
# Test RAG endpoint directly
curl -X POST "https://symbi-exec.vercel.app/api/rag/retrieve" \
  -H "Content-Type: application/json" \
  -d '{"q": "What is SYMBI?", "top_k": 3}'

# Test executor endpoint (requires valid HMAC)
# Generate HMAC signature for your intent first
```

## 7. Data Ingestion

Run the Python ingestion script (see `ingest_vault_weaviate.py`) to populate Weaviate with SYMBI-Vault content. This should be run whenever the vault is updated.

## Troubleshooting

- Ensure all environment variables are set correctly
- Verify Weaviate cluster is accessible and VaultDoc class exists
- Check that OpenAI API key has sufficient credits
- Validate HMAC signatures are generated correctly for executor requests