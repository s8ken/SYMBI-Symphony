# 🚀 Deploy SYMBI Trust Protocol Demo to Vercel

## Prerequisites Checklist

- [ ] **Vercel Account**: Create account at [vercel.com](https://vercel.com)
- [ ] **Demo MongoDB Database**: Create a free MongoDB Atlas cluster for demo
- [ ] **API Keys**: Get free tier keys for OpenAI/Anthropic (optional for demo)
- [ ] **Vercel CLI**: Install with `npm i -g vercel`

## Step 1: Install Vercel CLI (if not installed)

```bash
npm install -g vercel
```

## Step 2: Set up Demo MongoDB Database

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new cluster (free tier)
3. Create a database user: `demo-user` with password `demo-password`
4. Whitelist IP addresses (0.0.0.0/0 for demo)
5. Get your connection string
6. Replace the MONGODB_URI in `.env.production`

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel dashboard → Project Settings → Environment Variables and add:

```bash
NODE_ENV=demo
DEMO_MODE=true
MONGODB_URI=mongodb+srv://demo-user:demo-password@cluster.mongodb.net/symbi_demo
JWT_SECRET=demo-jwt-secret-for-showcase-only-not-secure
DEMO_MAX_USERS=100
DEMO_MAX_CONVERSATIONS_PER_USER=3
DEMO_MAX_MESSAGES_PER_CONVERSATION=10
DEMO_RATE_LIMIT=50
DEMO_RATE_WINDOW=900
CORS_ORIGIN=https://your-vercel-app-url.vercel.app
CLIENT_URL=https://your-vercel-app-url.vercel.app
OPENAI_API_KEY=your-demo-key-here
ANTHROPIC_API_KEY=your-demo-key-here
WEAVIATE_URL=disabled
SNOWFLAKE_ACCOUNT=disabled
LEDGER_SIGNING_KEY=disabled
VERCEL=1
PORT=5000
```

## Step 4: Deploy to Vercel

### Option A: Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy from project root
vercel

# Follow the prompts:
# - Link to existing project? (if you have one)
# - Project name: symbi-trust-demo
# - Deploy? Yes
```

### Option B: Via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `.` (leave empty)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
   - **Install Command**: `npm install && cd frontend && npm install`

## Step 5: Add Demo Notice Component

Create `frontend/src/components/DemoNotice.js`:

```jsx
import React from 'react';
import { Alert, Box, Typography, Link } from '@mui/material';

const DemoNotice = () => {
  if (process.env.REACT_APP_DEMO_MODE !== 'true') return null;

  return (
    <Box sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1200 }}>
      <Alert severity="info" sx={{ borderRadius: 0 }}>
        <Typography variant="body2">
          🎭 <strong>Demo Mode</strong> - This showcases SYMBI Trust Protocol capabilities. 
          Limited functionality for demonstration purposes.
          <Link href="mailto:your-email@domain.com" sx={{ ml: 1 }}>
            Contact for full version
          </Link>
        </Typography>
      </Alert>
    </Box>
  );
};

export default DemoNotice;
```

## Step 6: Seed Demo Data

After deployment, you can seed demo data by making a POST request to:
`https://your-app.vercel.app/api/seed-demo-data`

## Step 7: Test Your Demo

Visit your deployed app and test:

- [ ] **Landing page** shows demo notice
- [ ] **Registration/Login** works with demo users
- [ ] **Conversations** are limited to demo restrictions
- [ ] **API endpoints** return demo data
- [ ] **Trust protocol** features work
- [ ] **Rate limiting** is active

## Demo User Credentials

- **Regular User**: `demo@symbi-trust.com` / `demo123`
- **Admin User**: `admin@symbi-trust.com` / `demo123`

## Troubleshooting

### Common Issues:

1. **Build fails**: Check that all dependencies are in `package.json`
2. **API not working**: Verify environment variables in Vercel dashboard
3. **Database connection**: Ensure MongoDB Atlas is configured correctly
4. **CORS errors**: Update CORS_ORIGIN with your actual Vercel URL

### Logs:
- Vercel Dashboard → Functions tab → View Function Logs
- Check browser console for frontend errors

## Post-Deployment Checklist

- [ ] Demo notice appears on all pages
- [ ] Rate limiting is working (50 requests per 15 min)
- [ ] MongoDB connection is successful
- [ ] Trust protocol features demonstrate properly
- [ ] All demo restrictions are enforced
- [ ] Performance is acceptable for demo purposes

## Next Steps for Fundraising

1. **Custom domain**: Point a professional domain to your Vercel app
2. **Demo script**: Prepare talking points for each feature
3. **Analytics**: Add simple usage tracking for investor metrics
4. **Video walkthrough**: Record screen demos of key features
5. **Pitch deck**: Reference your deployed demo URL

---

**Your demo will be live at**: `https://your-project-name.vercel.app`

Good luck with your fundraising! 🚀