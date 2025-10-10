#!/bin/bash

echo "🚀 Setting up Vercel environment for Railway backend..."

# Set Vercel environment variables to point to Railway
echo "Setting REACT_APP_API_BASE..."
vercel env add REACT_APP_API_BASE <<< "https://symbi-api-production.up.railway.app"

echo "Setting REACT_APP_DEMO_MODE..."
vercel env add REACT_APP_DEMO_MODE <<< "true"

echo "✅ Vercel environment configured!"
echo "🔄 Now redeploy with: vercel --prod"