# Production RAG and Executor Implementation Plan

## Completed
- AgentVerse repo cloned and dependencies installed
- SYMBI Hosted agent (agent.py) implemented and tested
- Site-specific agents (ycq-agent.py, gammatria-agent.py) created

## Next Steps
1. Create pgvector DDL file (vault_ddl.sql)
2. Create ingest_vault.py script for indexing SYMBI-Vault
3. Create Next.js project for executor and retrieval APIs
4. Implement /api/rag/retrieve route in Next.js
5. Implement /api/exec route in Next.js with HMAC and signing
6. Create repo_agent.py for GitHub webhook handling
7. Update Hosted agents to use executor URL
8. Create policy.json and receipt.schema.json
9. Add basic monitoring to executor
10. Test end-to-end with sample query and GitHub PR

## Dependencies
- Install Python deps: pip install psycopg2 openai fastapi uvicorn tweetnacl-py bs58
- Set env vars: DATABASE_URL, OPENAI_API_KEY, SYMBI_SHARED_SECRET, ED25519_PRIV_HEX
- Vercel deployment for Next.js APIs
- GitHub webhook setup for repo agent
