#!/bin/bash

# SYMBI-Vault Weaviate Schema Creation Script
# Creates the VaultDoc class in Weaviate using the REST API

set -e  # Exit on any error

# Check required environment variables
if [ -z "$WEAVIATE_HOST" ]; then
    echo "Error: WEAVIATE_HOST environment variable is not set"
    echo "Please set: export WEAVIATE_HOST=https://your-cluster.weaviate.network"
    exit 1
fi

if [ -z "$WEAVIATE_API_KEY" ]; then
    echo "Error: WEAVIATE_API_KEY environment variable is not set"
    echo "Please set: export WEAVIATE_API_KEY=your-api-key"
    exit 1
fi

echo "Creating VaultDoc schema in Weaviate..."
echo "Host: $WEAVIATE_HOST"

# Check if schema file exists
if [ ! -f "vaultdoc_schema.json" ]; then
    echo "Error: vaultdoc_schema.json not found in current directory"
    exit 1
fi

# Create the schema
echo "Posting schema to $WEAVIATE_HOST/v1/schema"
response=$(curl -s -w "\n%{http_code}" -X POST "$WEAVIATE_HOST/v1/schema" \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $WEAVIATE_API_KEY" \
  -d @vaultdoc_schema.json)

# Extract HTTP status code (last line) - macOS compatible
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

echo "HTTP Status: $http_code"
echo "Response: $response_body"

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo "✓ VaultDoc schema created successfully!"
elif [ "$http_code" -eq 422 ] && echo "$response_body" | grep -q "already exists"; then
    echo "⚠ VaultDoc class already exists. Attempting to update..."
    
    # Try to update the existing schema
    update_response=$(curl -s -w "\n%{http_code}" -X PUT "$WEAVIATE_HOST/v1/schema/VaultDoc" \
      -H "content-type: application/json" \
      -H "Authorization: Bearer $WEAVIATE_API_KEY" \
      -d @vaultdoc_schema.json)
    
    update_http_code=$(echo "$update_response" | tail -n1)
    update_response_body=$(echo "$update_response" | sed '$d')
    
    echo "Update HTTP Status: $update_http_code"
    echo "Update Response: $update_response_body"
    
    if [ "$update_http_code" -eq 200 ]; then
        echo "✓ VaultDoc schema updated successfully!"
    else
        echo "✗ Failed to update VaultDoc schema"
        exit 1
    fi
else
    echo "✗ Failed to create VaultDoc schema"
    exit 1
fi

# Verify the schema was created
echo "Verifying schema creation..."
verify_response=$(curl -s "$WEAVIATE_HOST/v1/schema/VaultDoc" \
  -H "Authorization: Bearer $WEAVIATE_API_KEY")

if echo "$verify_response" | grep -q '"class":"VaultDoc"'; then
    echo "✓ Schema verification successful!"
    echo "VaultDoc class is ready for ingestion."
else
    echo "✗ Schema verification failed"
    echo "Response: $verify_response"
    exit 1
fi