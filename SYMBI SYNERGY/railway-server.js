// Railway-optimized server entry point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Vercel frontend
app.use(cors({
  origin: [
    'https://symbi-synergy-pa9k82n5m-ycq.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    demo: process.env.DEMO_MODE === 'true',
    environment: process.env.NODE_ENV || 'development',
    service: 'symbi-api-railway'
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'SYMBI Trust Protocol API is running',
    version: '1.0.0',
    demo: process.env.DEMO_MODE === 'true',
    endpoints: {
      health: '/api/healthz',
      auth: '/api/auth',
      users: '/api/users',
      conversations: '/api/conversations',
      llm: '/api/llm',
      agents: '/api/agents',
      trust: '/api/trust'
    },
    documentation: 'Demo API for SYMBI Trust Protocol'
  });
});

// Demo LLM models endpoint
app.get('/api/llm/models/openai', (req, res) => {
  res.json({
    success: true,
    models: [
      { id: 'gpt-4o', name: 'GPT-4 Omni (Demo)', provider: 'openai' },
      { id: 'gpt-4o-mini', name: 'GPT-4 Omni Mini (Demo)', provider: 'openai' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo (Demo)', provider: 'openai' }
    ],
    demo: true,
    note: 'Demo environment - models may have limited functionality'
  });
});

// Catch all API routes for demo
app.all('/api/*', (req, res) => {
  res.json({
    success: true,
    message: 'SYMBI API Demo Endpoint',
    path: req.path,
    method: req.method,
    demo: true,
    note: 'This is a demo API response. Full functionality available in production.'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚂 SYMBI Railway API running on port ${PORT}`);
  console.log(`🎭 Demo mode: ${process.env.DEMO_MODE === 'true'}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;