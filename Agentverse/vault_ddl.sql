CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS vault_docs (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  title TEXT,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),        -- set to your embedding dims
  metadata JSONB,
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_docs_path ON vault_docs(path);
CREATE INDEX IF NOT EXISTS idx_vault_docs_updated ON vault_docs(updated_at);
CREATE INDEX IF NOT EXISTS idx_vault_docs_vec ON vault_docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
