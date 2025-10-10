const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

// Load demo environment
require('dotenv').config({ path: '.env.demo-local' });

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for local frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// In-memory demo storage
const DEMO_USERS = {
  'demo@symbi-trust.com': {
    id: 'user-demo-001',
    email: 'demo@symbi-trust.com',
    password: 'demo123',
    name: 'Demo User',
    role: 'user',
    trust_score: 0.95,
    created_at: new Date().toISOString()
  },
  'admin@symbi-trust.com': {
    id: 'user-admin-001', 
    email: 'admin@symbi-trust.com',
    password: 'demo123',
    name: 'Admin User',
    role: 'admin',
    trust_score: 0.98,
    created_at: new Date().toISOString()
  }
};

const DEMO_DATA = {
  conversations: [
    {
      id: 'conv-demo-001',
      user_id: 'user-demo-001',
      title: 'YCQ Sonate Demo Conversation',
      created_at: new Date().toISOString(),
      messages: [
        {
          id: 'msg-001',
          content: 'Hello! Can you explain how YCQ Sonate ensures AI trust?',
          sender: 'user',
          timestamp: new Date().toISOString()
        },
        {
          id: 'msg-002',
          content: 'YCQ Sonate ensures AI trust through our four core modules: Sonate Ledger provides cryptographic audit trails with Ed25519 signatures, Sonate Guardrails enforce policy compliance across all AI providers, Sonate Roundtable delivers fairness-aware QA that separates AI vs human performance metrics, and Sonate Capsules orchestrate context after trust is established.',
          sender: 'assistant',
          timestamp: new Date().toISOString(),
          model: 'claude-3.5-sonnet',
          trust_score: 0.97
        }
      ]
    }
  ],
  ledger: [
    {
      id: 'ledger-001',
      timestamp: new Date().toISOString(),
      event: 'SESSION_START',
      session_id: 'conv-demo-001',
      hash: '0xa1b2c3d4e5f6789',
      prev_hash: '0x0000000000000000',
      signature: 'ed25519_demo_signature',
      verified: true
    },
    {
      id: 'ledger-002', 
      timestamp: new Date().toISOString(),
      event: 'TRUST_INIT',
      session_id: 'conv-demo-001',
      hash: '0xf6e5d4c3b2a1098',
      prev_hash: '0xa1b2c3d4e5f6789',
      signature: 'ed25519_demo_signature_2',
      verified: true
    },
    {
      id: 'ledger-003',
      timestamp: new Date().toISOString(),
      event: 'MESSAGE_PROCESSED',
      session_id: 'conv-demo-001',
      hash: '0x123456789abcdef',
      prev_hash: '0xf6e5d4c3b2a1098',
      signature: 'ed25519_demo_signature_3',
      verified: true
    }
  ],
  metrics: {
    fcr_a: 0.88,
    fcr_h: 0.84,
    afi: 1.18,
    tis: 0.993,
    escalation_delta: 0.12,
    loi: 0.73,
    total_sessions: 1247,
    verified_sessions: 1238,
    trust_violations: 2,
    avg_response_time: 0.094
  },
  agents: [
    {
      id: 'agent-demo-001',
      name: 'YCQ Financial Analyst',
      description: 'Specialized financial analysis agent with deep understanding of market trends, risk assessment, and investment strategies.',
      type: 'private',
      model: 'claude-3.5-sonnet',
      system_prompt: 'You are a financial analyst AI specialized in providing detailed market analysis, risk assessments, and investment recommendations.',
      trust_score: 0.94,
      created_by: 'user-demo-001',
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
      usage_count: 47,
      status: 'active'
    },
    {
      id: 'agent-demo-002',
      name: 'YCQ Legal Advisor',
      description: 'Expert legal AI agent for contract review, compliance analysis, and legal research.',
      type: 'public',
      model: 'gpt-4',
      system_prompt: 'You are a legal advisor AI with expertise in contract law, regulatory compliance, and legal research.',
      trust_score: 0.91,
      created_by: 'user-admin-001',
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
      usage_count: 23,
      status: 'active'
    },
    {
      id: 'agent-demo-003',
      name: 'YCQ Technical Writer',
      description: 'AI agent specialized in creating technical documentation, API docs, and user guides.',
      type: 'private',
      model: 'claude-3.5-sonnet',
      system_prompt: 'You are a technical writing specialist focused on creating clear, comprehensive documentation.',
      trust_score: 0.96,
      created_by: 'user-demo-001',
      created_at: new Date().toISOString(),
      last_used: new Date().toISOString(),
      usage_count: 12,
      status: 'active'
    }
  ],
  contexts: [
    {
      _id: 'ctx-demo-001',
      tag: 'user-authentication-policy',
      source: 'symbi',
      data: {
        'max_login_attempts': 5,
        'lockout_duration_minutes': 30,
        'password_requirements': {
          'min_length': 8,
          'require_uppercase': true,
          'require_numbers': true,
          'require_symbols': true
        },
        'mfa_required': true,
        'session_timeout_hours': 24
      },
      trustScore: 5,
      isActive: true,
      createdBy: 'user-demo-001',
      createdAt: new Date().toISOString(),
      metadata: {
        source_type: 'policy',
        last_verified: new Date().toISOString()
      }
    },
    {
      _id: 'ctx-demo-002',
      tag: 'payment-processing-config',
      source: 'symbi',
      data: {
        'provider': 'stripe',
        'webhook_url': 'https://api.ycq-sonate.com/webhooks/stripe',
        'supported_currencies': ['USD', 'EUR', 'GBP', 'CAD'],
        'sandbox_mode': false,
        'retry_failed_payments': true,
        'max_retry_attempts': 3
      },
      trustScore: 4,
      isActive: true,
      createdBy: 'user-demo-001',
      createdAt: new Date().toISOString(),
      metadata: {
        source_type: 'configuration',
        environment: 'production'
      }
    },
    {
      _id: 'ctx-demo-003',
      tag: 'ai-model-guardrails',
      source: 'symbi',
      data: {
        'forbidden_topics': ['personal_data_extraction', 'harmful_content', 'financial_advice_without_disclosure'],
        'required_disclaimers': ['AI_generated_content', 'not_financial_advice', 'verify_information'],
        'content_filtering': {
          'enabled': true,
          'severity_threshold': 'medium',
          'auto_block': true
        },
        'audit_all_responses': true
      },
      trustScore: 5,
      isActive: true,
      createdBy: 'user-admin-001',
      createdAt: new Date().toISOString(),
      metadata: {
        source_type: 'guardrails',
        compliance_level: 'enterprise'
      }
    },
    {
      _id: 'ctx-demo-004',
      tag: 'customer-support-knowledge',
      source: 'symbi',
      data: {
        'common_issues': {
          'login_problems': 'Check password requirements and MFA setup',
          'payment_failures': 'Verify card details and contact bank if needed',
          'account_access': 'Reset password or contact support for manual unlock'
        },
        'escalation_triggers': ['legal_inquiry', 'data_breach_report', 'enterprise_client'],
        'response_templates': {
          'greeting': 'Thank you for contacting YCQ Sonate support',
          'resolution': 'Is there anything else I can help you with today?'
        }
      },
      trustScore: 3,
      isActive: true,
      createdBy: 'user-demo-001',
      createdAt: new Date().toISOString(),
      metadata: {
        source_type: 'knowledge_base',
        last_updated: new Date().toISOString()
      }
    }
  ]
};

// Helper functions
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'YCQ Sonate Local Demo Server',
    timestamp: new Date().toISOString(),
    demo: true,
    version: '1.0.0-demo',
    uptime: process.uptime()
  });
});

// Authentication
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

  const token = generateToken(user);
  
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

  const newUser = {
    id: 'user-' + crypto.randomBytes(8).toString('hex'),
    email: email.toLowerCase(),
    password: password,
    name,
    role: 'user',
    trust_score: 0.5,
    created_at: new Date().toISOString()
  };
  
  DEMO_USERS[email.toLowerCase()] = newUser;
  const token = generateToken(newUser);
  
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

// User profile
app.get('/api/user/profile', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

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
});

// Conversations
app.get('/api/conversations', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const userConversations = DEMO_DATA.conversations.filter(c => c.user_id === payload.userId);
  
  res.json({
    success: true,
    conversations: userConversations,
    demo: true
  });
});

// Create conversation
app.post('/api/conversations', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { title } = req.body;
  const newConversation = {
    id: 'conv-' + crypto.randomBytes(8).toString('hex'),
    user_id: payload.userId,
    title: title || 'New Conversation',
    created_at: new Date().toISOString(),
    messages: []
  };

  DEMO_DATA.conversations.push(newConversation);

  res.json({
    success: true,
    conversation: newConversation,
    demo: true
  });
});

// Send message
app.post('/api/conversations/:id/messages', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const { content } = req.body;

  const conversation = DEMO_DATA.conversations.find(c => c.id === id);
  if (!conversation) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Add user message
  const userMessage = {
    id: 'msg-' + crypto.randomBytes(8).toString('hex'),
    content,
    sender: 'user',
    timestamp: new Date().toISOString()
  };
  conversation.messages.push(userMessage);

  // Generate AI response
  const aiResponse = {
    id: 'msg-' + crypto.randomBytes(8).toString('hex'),
    content: `This is a demo response from YCQ Sonate. You asked: "${content}". In a production system, this would be orchestrated across multiple AI providers with full cryptographic audit trails, trust scoring, and policy guardrails.`,
    sender: 'assistant',
    timestamp: new Date().toISOString(),
    model: 'claude-3.5-sonnet',
    trust_score: 0.95 + Math.random() * 0.05,
    receipt_id: 'rcpt-' + crypto.randomBytes(8).toString('hex')
  };
  conversation.messages.push(aiResponse);

  // Add to ledger
  const ledgerEntry = {
    id: 'ledger-' + crypto.randomBytes(8).toString('hex'),
    timestamp: new Date().toISOString(),
    event: 'MESSAGE_PROCESSED',
    session_id: id,
    hash: '0x' + crypto.randomBytes(16).toString('hex'),
    prev_hash: DEMO_DATA.ledger[DEMO_DATA.ledger.length - 1]?.hash || '0x0000000000000000',
    signature: 'ed25519_demo_signature_' + Date.now(),
    verified: true
  };
  DEMO_DATA.ledger.push(ledgerEntry);

  res.json({
    success: true,
    message: aiResponse,
    ledger_entry: ledgerEntry,
    demo: true
  });
});

// Metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    data: DEMO_DATA.metrics,
    timestamp: new Date().toISOString(),
    demo: true
  });
});

// Ledger
app.get('/api/ledger', (req, res) => {
  const { session_id } = req.query;
  
  let ledgerEntries = DEMO_DATA.ledger;
  if (session_id) {
    ledgerEntries = ledgerEntries.filter(entry => entry.session_id === session_id);
  }

  res.json({
    success: true,
    entries: ledgerEntries,
    total: ledgerEntries.length,
    demo: true
  });
});

// Ledger verification
app.get('/api/ledger/verify', (req, res) => {
  const { session_id } = req.query;
  
  res.json({
    success: true,
    verified: true,
    integrity_score: 0.993,
    message: 'Hash-chain verified successfully',
    session_id: session_id || 'all',
    verified_entries: session_id ? 
      DEMO_DATA.ledger.filter(e => e.session_id === session_id).length :
      DEMO_DATA.ledger.length,
    demo: true
  });
});

// Trust score
app.get('/api/trust/score/:userId', (req, res) => {
  const { userId } = req.params;
  const user = Object.values(DEMO_USERS).find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({
    success: true,
    user_id: userId,
    trust_score: user.trust_score,
    factors: {
      conversation_quality: 0.94,
      policy_compliance: 0.98,
      escalation_rate: 0.92,
      verification_success: 0.99
    },
    demo: true
  });
});

// Agents
app.get('/api/agents', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Return user's private agents and all public agents
  const userAgents = DEMO_DATA.agents.filter(agent => 
    agent.created_by === payload.userId || agent.type === 'public'
  );

  res.json({
    success: true,
    data: userAgents,
    total: userAgents.length,
    demo: true
  });
});

app.get('/api/agents/public', (req, res) => {
  const publicAgents = DEMO_DATA.agents.filter(agent => agent.type === 'public');
  
  res.json({
    success: true,
    data: publicAgents,
    total: publicAgents.length,
    demo: true
  });
});

// Get specific agent
app.get('/api/agents/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const agent = DEMO_DATA.agents.find(a => a.id === id);
  
  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }

  // Check if user has access to this agent
  if (agent.type === 'private' && agent.created_by !== payload.userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({
    success: true,
    data: agent,
    demo: true
  });
});

// Create agent
app.post('/api/agents', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { name, description, type, model, system_prompt } = req.body;
  
  if (!name || !description) {
    return res.status(400).json({
      success: false,
      message: 'Name and description are required'
    });
  }

  const newAgent = {
    id: 'agent-' + crypto.randomBytes(8).toString('hex'),
    name,
    description,
    type: type || 'private',
    model: model || 'claude-3.5-sonnet',
    system_prompt: system_prompt || `You are ${name}, a specialized AI assistant.`,
    trust_score: 0.5,
    created_by: payload.userId,
    created_at: new Date().toISOString(),
    last_used: new Date().toISOString(),
    usage_count: 0,
    status: 'active'
  };

  DEMO_DATA.agents.push(newAgent);

  res.json({
    success: true,
    data: newAgent,
    demo: true
  });
});

// Update agent
app.put('/api/agents/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const agentIndex = DEMO_DATA.agents.findIndex(a => a.id === id);
  
  if (agentIndex === -1) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }

  const agent = DEMO_DATA.agents[agentIndex];
  
  // Check if user owns this agent
  if (agent.created_by !== payload.userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  const { name, description, type, model, system_prompt } = req.body;
  
  // Update agent
  DEMO_DATA.agents[agentIndex] = {
    ...agent,
    name: name || agent.name,
    description: description || agent.description,
    type: type || agent.type,
    model: model || agent.model,
    system_prompt: system_prompt || agent.system_prompt
  };

  res.json({
    success: true,
    data: DEMO_DATA.agents[agentIndex],
    demo: true
  });
});

// Delete agent
app.delete('/api/agents/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const agentIndex = DEMO_DATA.agents.findIndex(a => a.id === id);
  
  if (agentIndex === -1) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }

  const agent = DEMO_DATA.agents[agentIndex];
  
  // Check if user owns this agent
  if (agent.created_by !== payload.userId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  DEMO_DATA.agents.splice(agentIndex, 1);

  res.json({
    success: true,
    message: 'Agent deleted successfully',
    demo: true
  });
});

// Context Bridge APIs

// Get contexts with filtering
app.get('/api/context', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { page = 1, limit = 10, source, tag } = req.query;
  let contexts = [...DEMO_DATA.contexts];

  // Apply filters
  if (source && source !== 'all') {
    contexts = contexts.filter(ctx => ctx.source === source);
  }

  if (tag) {
    contexts = contexts.filter(ctx => 
      ctx.tag.toLowerCase().includes(tag.toLowerCase())
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedContexts = contexts.slice(startIndex, endIndex);

  res.json({
    success: true,
    contexts: paginatedContexts,
    total: contexts.length,
    page: parseInt(page),
    totalPages: Math.ceil(contexts.length / limit),
    demo: true
  });
});

// Create new context
app.post('/api/context', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { tag, source, data, trustScore } = req.body;
  
  if (!tag || !source || !data) {
    return res.status(400).json({
      success: false,
      message: 'Tag, source, and data are required'
    });
  }

  const newContext = {
    _id: 'ctx-' + crypto.randomBytes(8).toString('hex'),
    tag,
    source: source || 'symbi',
    data,
    trustScore: trustScore || 3,
    isActive: true,
    createdBy: payload.userId,
    createdAt: new Date().toISOString(),
    metadata: {
      source_type: 'user_generated',
      created_via: 'context_bridge'
    }
  };

  DEMO_DATA.contexts.push(newContext);

  res.json({
    success: true,
    context: newContext,
    demo: true
  });
});

// Delete context
app.delete('/api/context/:id', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const contextIndex = DEMO_DATA.contexts.findIndex(ctx => ctx._id === id);
  
  if (contextIndex === -1) {
    return res.status(404).json({ success: false, message: 'Context not found' });
  }

  const context = DEMO_DATA.contexts[contextIndex];
  
  // Check if user owns this context or is admin
  if (context.createdBy !== payload.userId && payload.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  DEMO_DATA.contexts.splice(contextIndex, 1);

  res.json({
    success: true,
    message: 'Context deleted successfully',
    demo: true
  });
});

// Deactivate context
app.put('/api/context/:id/deactivate', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const context = DEMO_DATA.contexts.find(ctx => ctx._id === id);
  
  if (!context) {
    return res.status(404).json({ success: false, message: 'Context not found' });
  }

  // Check if user owns this context or is admin
  if (context.createdBy !== payload.userId && payload.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  context.isActive = false;

  res.json({
    success: true,
    message: 'Context deactivated successfully',
    context,
    demo: true
  });
});

// Semantic search (mock Weaviate functionality)
app.get('/api/context/search', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { query, limit = 10, threshold = 0.7 } = req.query;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter is required'
    });
  }

  // Mock semantic search - in reality this would use Weaviate
  const searchResults = DEMO_DATA.contexts
    .filter(ctx => {
      const searchText = `${ctx.tag} ${JSON.stringify(ctx.data)}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    })
    .map(ctx => ({
      ...ctx,
      similarity: 0.85 + Math.random() * 0.15, // Mock similarity score
      highlights: [ctx.tag] // Mock highlights
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  res.json({
    success: true,
    results: searchResults,
    query,
    total: searchResults.length,
    demo: true,
    vector_search: false // Indicate this is mock search
  });
});

// Weaviate status check
app.get('/api/context/weaviate/status', (req, res) => {
  res.json({
    success: true,
    connected: false, // Demo mode doesn't have real Weaviate
    status: 'demo_mode',
    message: 'Vector search disabled in demo mode',
    demo: true
  });
});

// Bridge recommendations
app.get('/api/context/recommendations', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { sourceTag, limit = 5 } = req.query;
  
  // Mock recommendations based on tag similarity
  const recommendations = DEMO_DATA.contexts
    .filter(ctx => ctx.tag !== sourceTag)
    .map(ctx => ({
      tag: ctx.tag,
      similarity: Math.random() * 0.8 + 0.2,
      reason: `Related to ${sourceTag} based on content analysis`
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  res.json({
    success: true,
    recommendations,
    sourceTag,
    demo: true
  });
});

// Create context bridge
app.post('/api/context/bridge', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { fromTag, toTag, data } = req.body;
  
  if (!fromTag || !toTag) {
    return res.status(400).json({
      success: false,
      message: 'fromTag and toTag are required'
    });
  }

  const bridge = {
    id: 'bridge-' + crypto.randomBytes(8).toString('hex'),
    fromTag,
    toTag,
    data: data || {},
    createdBy: payload.userId,
    createdAt: new Date().toISOString()
  };

  // In a real system, this would create relationships in the vector database
  res.json({
    success: true,
    bridge,
    message: 'Context bridge created successfully',
    demo: true
  });
});

// Default 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    demo: true
  });
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 YCQ Sonate Demo Server running on http://localhost:${PORT}`);
  console.log(`📊 Demo Mode: ${process.env.DEMO_MODE}`);
  console.log(`👤 Demo Users:`);
  console.log(`   • demo@symbi-trust.com / demo123`);
  console.log(`   • admin@symbi-trust.com / demo123`);
  console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;