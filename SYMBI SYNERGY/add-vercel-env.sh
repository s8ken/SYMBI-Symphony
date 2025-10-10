#!/bin/bash

# Add essential demo environment variables to Vercel
echo "Adding environment variables to Vercel..."

# Basic demo configuration
vercel env add NODE_ENV <<< "demo"
vercel env add DEMO_MODE <<< "true" 
vercel env add PORT <<< "5000"

# JWT and CORS
vercel env add JWT_SECRET <<< "demo-jwt-secret-for-showcase-only-not-secure"
vercel env add CORS_ORIGIN <<< "https://symbi-synergy-pa9k82n5m-ycq.vercel.app"
vercel env add CLIENT_URL <<< "https://symbi-synergy-pa9k82n5m-ycq.vercel.app"

# Demo limits
vercel env add DEMO_MAX_USERS <<< "100"
vercel env add DEMO_MAX_CONVERSATIONS_PER_USER <<< "3"
vercel env add DEMO_MAX_MESSAGES_PER_CONVERSATION <<< "10"
vercel env add DEMO_RATE_LIMIT <<< "50"
vercel env add DEMO_RATE_WINDOW <<< "900"

# Frontend demo mode
vercel env add REACT_APP_DEMO_MODE <<< "true"
vercel env add REACT_APP_API_URL <<< "/api"

# Disable external services
vercel env add WEAVIATE_URL <<< "disabled"
vercel env add SNOWFLAKE_ACCOUNT <<< "disabled"
vercel env add LEDGER_SIGNING_KEY <<< "disabled"

# Vercel specific
vercel env add VERCEL <<< "1"

echo "Environment variables added! Now redeploying..."
vercel --prod