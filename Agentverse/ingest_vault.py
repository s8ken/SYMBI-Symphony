
#!/usr/bin/env python3
"""
AgentVerse SYMBI-Vault Ingestion Script
Aligned with tactical-command-interface for seamless integration

This script processes markdown files from SYMBI-Vault, chunks them,
and uploads to Weaviate using the VaultDoc schema compatible with
tactical-command-interface RAG system.
"""

import os
import glob
import hashlib
import json
from pathlib import Path
from datetime import datetime
import weaviate
from openai import OpenAI
import tiktoken

# Configuration - aligned with tactical-command-interface
VAULT_DIR = "SYMBI-Vault/SYMBI-vault"
EMBED_MODEL = "text-embedding-3-small"
MAX_TOKENS_PER_CHUNK = 600
OVERLAP_TOKENS = 80
BATCH_SIZE = 50

def sha(s: str) -> str:
    """Generate SHA-256 hash of string."""
    return hashlib.sha256(s.encode()).hexdigest()

def chunk_text(txt: str, max_tokens: int = MAX_TOKENS_PER_CHUNK, overlap: int = OVERLAP_TOKENS) -> list[str]:
    """Split text into overlapping chunks based on token count."""
    enc = tiktoken.get_encoding("cl100k_base")
    toks = enc.encode(txt)
    chunks = []
    i = 0
    while i < len(toks):
        j = min(i + max_tokens, len(toks))
        chunks.append(enc.decode(toks[i:j]))
        i = max(0, j - overlap)
    return chunks

def main():
    """Main ingestion function compatible with tactical-command-interface."""
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Connect to Weaviate using tactical-command-interface compatible settings
    weaviate_client = weaviate.Client(
        url=os.getenv("WEAVIATE_HOST", "https://8fc2400a-786b-46ea-953a-ff4818358657.weaviate.network"),
        auth_client_secret=weaviate.AuthApiKey(api_key=os.getenv("WEAVIATE_API_KEY")),
        additional_headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")}
    )

    # Check if VaultDoc class exists (tactical-command-interface schema)
    try:
        schema = weaviate_client.schema.get("VaultDoc")
        print("Using existing VaultDoc schema from tactical-command-interface")
    except Exception as e:
        print(f"VaultDoc schema not found: {e}")
        print("Please ensure tactical-command-interface Weaviate schema is set up first")
        return

    # Process markdown files using tactical-command-interface compatible format
    paths = glob.glob(f"{VAULT_DIR}/**/*.md", recursive=True)
    processed_count = 0
    
    for p in paths:
        try:
            text = Path(p).read_text(encoding="utf-8")
            title = Path(p).stem
            doc_id = sha(p)  # Stable document ID
            chunks = chunk_text(text)
            
            # Generate embeddings for each chunk
            for i, chunk in enumerate(chunks):
                # Get embedding from OpenAI
                response = openai_client.embeddings.create(
                    input=chunk,
                    model=EMBED_MODEL
                )
                embedding = response.data[0].embedding
                
                # Create object compatible with tactical-command-interface VaultDoc schema
                obj = {
                    "path": p,
                    "title": title,
                    "chunk_index": i,
                    "content": chunk,
                    "doc_id": doc_id,
                    "source": "SYMBI-Vault",
                    "tags": ["agentverse", "symbi-vault"],
                    "updated_at": datetime.now().isoformat() + "Z",
                    "metadata": json.dumps({
                        "source": "SYMBI-Vault", 
                        "repo_path": p,
                        "ingested_by": "AgentVerse",
                        "chunk_count": len(chunks)
                    })
                }
                
                # Insert with embedding
                weaviate_client.data_object.create(
                    data_object=obj,
                    class_name="VaultDoc",
                    vector=embedding
                )
            
            processed_count += 1
            print(f"Indexed {p} ({len(chunks)} chunks)")
            
        except Exception as e:
            print(f"Error processing {p}: {e}")
            continue
    
    print(f"Successfully processed {processed_count} files from SYMBI-Vault")
    print("AgentVerse ingestion complete - compatible with tactical-command-interface")

if __name__ == "__main__":
    main()
