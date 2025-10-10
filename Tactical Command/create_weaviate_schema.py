#!/usr/bin/env python3
"""
Weaviate Schema Setup for SYMBI-Vault

This script creates the VaultDoc class in Weaviate with the proper schema
for ingesting SYMBI-Vault markdown files.

Usage:
    export WEAVIATE_HOST=https://<cluster-id>.weaviate.network
    export WEAVIATE_API_KEY=...
    python create_weaviate_schema.py

Requirements:
    - Weaviate cluster running and accessible
    - Valid WEAVIATE_HOST and WEAVIATE_API_KEY environment variables
"""

import os
import weaviate
import json

def create_vault_doc_schema():
    """Create the VaultDoc class schema in Weaviate."""
    
    # Validate environment variables
    weaviate_host = os.getenv("WEAVIATE_HOST")
    weaviate_api_key = os.getenv("WEAVIATE_API_KEY")
    
    if not weaviate_host or not weaviate_api_key:
        print("Error: Missing required environment variables:")
        print("  WEAVIATE_HOST - Your Weaviate cluster URL")
        print("  WEAVIATE_API_KEY - Your Weaviate API key")
        return False
    
    try:
        # Initialize Weaviate client
        print(f"Connecting to Weaviate at {weaviate_host}...")
        client = weaviate.Client(
            url=weaviate_host,
            additional_headers={"Authorization": f"Bearer {weaviate_api_key}"}
        )
        
        # Test connection
        schema = client.schema.get()
        print("✓ Connected to Weaviate successfully")
        
        # Check if VaultDoc class already exists
        existing_classes = [cls.get("class") for cls in schema.get("classes", [])]
        if "VaultDoc" in existing_classes:
            print("⚠ VaultDoc class already exists. Deleting and recreating...")
            client.schema.delete_class("VaultDoc")
        
        # Define VaultDoc class schema with production-ready configuration
        vault_doc_schema = {
            "class": "VaultDoc",
            "description": "SYMBI-Vault document chunks with embeddings for RAG retrieval",
            "vectorizer": "none",  # We'll provide our own vectors from OpenAI
            "vectorIndexType": "hnsw",
            "vectorIndexConfig": {
                "distance": "cosine",
                "efConstruction": 128,
                "maxConnections": 64,
                "ef": 128
            },
            "invertedIndexConfig": {
                "stopwords": {"preset": "en"},
                "indexTimestamps": True,
                "indexPropertyLength": True
            },
            "properties": [
                {
                    "name": "path",
                    "dataType": ["text"],
                    "description": "File path of the source document"
                },
                {
                    "name": "title",
                    "dataType": ["text"],
                    "description": "Document title (filename without extension)"
                },
                {
                    "name": "chunk_index",
                    "dataType": ["int"],
                    "description": "Index of this chunk within the document"
                },
                {
                    "name": "content",
                    "dataType": ["text"],
                    "description": "The actual text content of this chunk"
                },
                {
                    "name": "doc_id",
                    "dataType": ["text"],
                    "description": "Stable document ID (e.g., repo path hash)"
                },
                {
                    "name": "source",
                    "dataType": ["text"],
                    "description": "Source label, e.g., SYMBI-Vault"
                },
                {
                    "name": "tags",
                    "dataType": ["text[]"],
                    "description": "Arbitrary labels for routing/filtering"
                },
                {
                    "name": "updated_at",
                    "dataType": ["date"],
                    "description": "Last modified time of the source doc"
                },
                {
                    "name": "metadata",
                    "dataType": ["text"],
                    "description": "JSON string with any additional metadata"
                }
            ]
        }
        
        # Create the class
        print("Creating VaultDoc class schema...")
        client.schema.create_class(vault_doc_schema)
        print("✓ VaultDoc class created successfully")
        
        # Verify the schema was created
        updated_schema = client.schema.get()
        vault_doc_class = next(
            (cls for cls in updated_schema.get("classes", []) if cls.get("class") == "VaultDoc"),
            None
        )
        
        if vault_doc_class:
            print("✓ Schema verification successful")
            print(f"  Class: {vault_doc_class['class']}")
            print(f"  Properties: {len(vault_doc_class['properties'])}")
            print(f"  Vectorizer: {vault_doc_class.get('vectorizer', 'none')}")
            
            # Pretty print the schema
            print("\nCreated schema:")
            print(json.dumps(vault_doc_class, indent=2))
            
            return True
        else:
            print("✗ Schema verification failed - VaultDoc class not found")
            return False
            
    except Exception as e:
        print(f"✗ Error setting up Weaviate schema: {e}")
        return False

def main():
    """Main function."""
    print("SYMBI-Vault Weaviate Schema Setup")
    print("=" * 40)
    
    success = create_vault_doc_schema()
    
    if success:
        print("\n✓ Schema setup complete!")
        print("You can now run ingest_vault_weaviate.py to populate the database.")
        return 0
    else:
        print("\n✗ Schema setup failed!")
        return 1

if __name__ == "__main__":
    exit(main())