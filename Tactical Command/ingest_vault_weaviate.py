#!/usr/bin/env python3
"""
SYMBI-Vault to Weaviate Ingestion Script

This script processes markdown files from SYMBI-Vault, chunks them,
generates embeddings using OpenAI, and uploads to Weaviate.

Usage:
    pip install weaviate-client openai tiktoken
    export OPENAI_API_KEY=sk-...
    export WEAVIATE_HOST=https://<cluster-id>.weaviate.network
    export WEAVIATE_API_KEY=...
    python ingest_vault_weaviate.py

Requirements:
    - SYMBI-Vault repository cloned to SYMBI-Vault/SYMBI-vault/
    - Weaviate cluster with VaultDoc class created
    - OpenAI API key with embedding access
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

# Configuration
VAULT_DIR = "."  # Use current directory for markdown files
EMBED_MODEL = "text-embedding-3-small"
MAX_TOKENS_PER_CHUNK = 600
OVERLAP_TOKENS = 80
BATCH_SIZE = 50

def sha(s: str) -> str:
    """Generate SHA-256 hash of string."""
    return hashlib.sha256(s.encode()).hexdigest()

def chunk_text(txt: str, max_tokens: int = MAX_TOKENS_PER_CHUNK, overlap: int = OVERLAP_TOKENS) -> list[str]:
    """
    Split text into overlapping chunks based on token count.
    
    Args:
        txt: Input text to chunk
        max_tokens: Maximum tokens per chunk
        overlap: Number of overlapping tokens between chunks
    
    Returns:
        List of text chunks
    """
    enc = tiktoken.get_encoding("cl100k_base")
    toks = enc.encode(txt)
    chunks = []
    i = 0
    
    while i < len(toks):
        j = min(i + max_tokens, len(toks))
        chunk_text = enc.decode(toks[i:j])
        chunks.append(chunk_text)
        
        # Move forward with overlap
        if j >= len(toks):
            break
        i = max(i + 1, j - overlap)
    
    return chunks

def embed_texts(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of texts using OpenAI.
    
    Args:
        client: OpenAI client instance
        texts: List of texts to embed
    
    Returns:
        List of embedding vectors
    """
    resp = client.embeddings.create(model=EMBED_MODEL, input=texts)
    return [d.embedding for d in resp.data]

def process_file(file_path: str, wclient: weaviate.Client, oai_client: OpenAI) -> int:
    """
    Process a single markdown file and upload chunks to Weaviate.
    
    Args:
        file_path: Path to the markdown file
        wclient: Weaviate client instance
        oai_client: OpenAI client instance
    
    Returns:
        Number of chunks processed
    """
    try:
        text = Path(file_path).read_text(encoding="utf-8")
        title = Path(file_path).stem
        
        # Skip empty files
        if not text.strip():
            print(f"Skipping empty file: {file_path}")
            return 0
        
        # Chunk the text
        chunks = chunk_text(text)
        if not chunks:
            print(f"No chunks generated for: {file_path}")
            return 0
        
        # Generate embeddings
        print(f"Generating embeddings for {len(chunks)} chunks from {file_path}")
        embs = embed_texts(oai_client, chunks)
        
        # Upload to Weaviate in batches
        vault_doc = wclient.collections.get("VaultDoc")
        
        objects_to_insert = []
        for i, (chunk, vec) in enumerate(zip(chunks, embs)):
            # Generate unique ID for this chunk
            chunk_id = sha(f"{file_path}:{i}")
            
            # Get file modification time
            file_stat = Path(file_path).stat()
            updated_at = datetime.fromtimestamp(file_stat.st_mtime).isoformat() + "Z"
            
            # Prepare properties with new schema fields
            props = {
                "path": file_path,
                "title": title,
                "chunk_index": i,
                "content": chunk,
                "doc_id": sha(file_path),  # Stable document ID
                "source": "tactical-command-interface",
                "tags": ["tactical", "command", "interface"],
                "updated_at": updated_at,
                "metadata": json.dumps({
                    "repo_path": file_path,
                    "chunk_count": len(chunks),
                    "file_size": len(text)
                })
            }
            
            # Add to batch
            objects_to_insert.append(weaviate.data.DataObject(
                properties=props,
                uuid=chunk_id,
                vector=vec
            ))
        
        # Insert all objects
        vault_doc.data.insert_many(objects_to_insert)
        
        print(f"✓ Indexed {file_path} ({len(chunks)} chunks)")
        return len(chunks)
        
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return 0

def main():
    """Main ingestion function."""
    # Validate environment variables
    required_env_vars = ["OPENAI_API_KEY", "WEAVIATE_HOST", "WEAVIATE_API_KEY"]
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set:")
        for var in missing_vars:
            print(f"  export {var}=...")
        return 1
    
    # Check if vault directory exists
    if not os.path.exists(VAULT_DIR):
        print(f"Error: Directory not found at {VAULT_DIR}")
        return 1
    
    # Initialize clients
    print("Initializing clients...")
    wclient = weaviate.connect_to_weaviate_cloud(
        cluster_url=os.getenv("WEAVIATE_HOST"),
        auth_credentials=weaviate.auth.AuthApiKey(os.getenv("WEAVIATE_API_KEY"))
    )
    oai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Test Weaviate connection
    try:
        schema = wclient.collections.list_all()
        vault_doc_exists = "VaultDoc" in [col.name for col in schema]
        if not vault_doc_exists:
            print("Error: VaultDoc class not found in Weaviate schema.")
            print("Please create the VaultDoc class first (see VERCEL_DEPLOYMENT.md)")
            return 1
        print("✓ Connected to Weaviate, VaultDoc class found")
    except Exception as e:
        print(f"Error connecting to Weaviate: {e}")
        return 1
    
    # Find all markdown files (excluding node_modules)
    pattern = f"{VAULT_DIR}/**/*.md"
    all_md_files = glob.glob(pattern, recursive=True)
    md_files = [f for f in all_md_files if "node_modules" not in f]
    
    if not md_files:
        print(f"No markdown files found in {VAULT_DIR}")
        return 1
    
    print(f"Found {len(md_files)} markdown files to process")
    
    # Process files
    total_chunks = 0
    processed_files = 0
    
    for file_path in md_files:
        chunks_count = process_file(file_path, wclient, oai_client)
        if chunks_count > 0:
            total_chunks += chunks_count
            processed_files += 1
    
    print(f"\n✓ Ingestion complete!")
    print(f"  Files processed: {processed_files}/{len(md_files)}")
    print(f"  Total chunks: {total_chunks}")
    print(f"  Embedding model: {EMBED_MODEL}")
    
    # Close the client connection
    wclient.close()
    
    return 0

if __name__ == "__main__":
    exit(main())