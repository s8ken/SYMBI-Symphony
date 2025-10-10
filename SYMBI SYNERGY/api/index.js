const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Create Express app for serverless
const app = express();

// Enable CORS
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// In-memory demo users (for demo purposes only)
const DEMO_USERS = {
  'demo@symbi-trust.com': {
    id: 'user-demo-001',
    email: 'demo@symbi-trust.com',
    password: 'demo123', // In production this would be hashed
    name: 'Demo User',
    role: 'user',
    trust_score: 0.95
  },
  'admin@symbi-trust.com': {
    id: 'user-admin-001', 
    email: 'admin@symbi-trust.com',
    password: 'demo123',
    name: 'Admin User',
    role: 'admin',
    trust_score: 0.98
  }
};

// Demo conversations and data
const DEMO_DATA = {
  conversations: [],
  ledger: [],
  metrics: {
    fcr_a: 0.88,
    fcr_h: 0.84,
    afi: 1.18,
    tis: 0.993
  }
};

// Helper function to generate JWT-like token (demo only)
function generateDemoToken(user) {
  return Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  })).toString('base64');
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'YCQ Sonate API is running',
    timestamp: new Date().toISOString(),
    demo: true,
    env: 'production',
    version: '1.0.0'
  });
});

// Auth - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password required'
    });
  }

  const user = DEMO_USERS[email.toLowerCase()];
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  const token = generateDemoToken(user);
  
  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      trust_score: user.trust_score
    },
    token,
    demo: true
  });
});

// Auth - Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and name required'
    });
  }

  if (DEMO_USERS[email.toLowerCase()]) {
    return res.status(409).json({
      success: false,
      message: 'User already exists'
    });
  }

  // Create new demo user
  const newUser = {
    id: 'user-' + crypto.randomBytes(8).toString('hex'),
    email: email.toLowerCase(),
    password: password, // In production this would be hashed
    name,
    role: 'user',
    trust_score: 0.5
  };
  
  DEMO_USERS[email.toLowerCase()] = newUser;
  const token = generateDemoToken(newUser);
  
  res.json({
    success: true,
    message: 'Registration successful',
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      trust_score: newUser.trust_score
    },
    token,
    demo: true
  });
});

// Get user profile
app.get('/api/user/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const user = Object.values(DEMO_USERS).find(u => u.id === payload.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        trust_score: user.trust_score
      },
      demo: true
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Demo metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    data: DEMO_DATA.metrics,
    timestamp: new Date().toISOString(),
    demo: true
  });
});

// Demo ledger
app.get('/api/ledger', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'entry-001',
        timestamp: new Date().toISOString(),
        event: 'SESSION_START',
        hash: '0xa1b2c3d4e5f6',
        verified: true
      },
      {
        id: 'entry-002',
        timestamp: new Date().toISOString(),
        event: 'TRUST_INIT',
        hash: '0xf6e5d4c3b2a1',
        verified: true
      }
    ],
    demo: true
  });
});

// Ledger verify
app.get('/api/ledger/verify', (req, res) => {
  res.json({
    success: true,
    verified: true,
    integrity_score: 0.993,
    message: 'Hash-chain verified successfully',
    demo: true
  });
});

// Default handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'YCQ Sonate API endpoint not found',
    path: req.path,
    demo: true
  });
});

// For serverless
const serverless = require('serverless-http');
module.exports = serverless(app);