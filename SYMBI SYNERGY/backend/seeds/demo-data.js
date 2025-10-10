const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Demo seed data
const demoUsers = [
  {
    _id: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef0'),
    email: 'demo@symbi-trust.com',
    password: '$2a$12$LQv3c1yqBwEHxv68R6/BNOjhpOiNQjENghSOr/5hQOdGsktOLKOuG', // "demo123"
    role: 'user',
    preferences: {
      theme: 'light',
      notifications: true
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef1'),
    email: 'admin@symbi-trust.com', 
    password: '$2a$12$LQv3c1yqBwEHxv68R6/BNOjhpOiNQjENghSOr/5hQOdGsktOLKOuG', // "demo123"
    role: 'admin',
    preferences: {
      theme: 'dark',
      notifications: true
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

const demoConversations = [
  {
    _id: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef2'),
    user: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef0'),
    title: 'Demo: AI Trust Verification',
    messages: [
      {
        sender: 'user',
        content: 'Can you explain how cryptographic trust works in AI systems?',
        timestamp: new Date('2024-01-02T10:00:00Z')
      },
      {
        sender: 'assistant',
        content: 'Cryptographic trust in AI systems involves creating verifiable proof that interactions haven\'t been tampered with. This demo uses hash chains and Ed25519 signatures to create an immutable ledger of all AI interactions, ensuring complete transparency and audit trails for enterprise compliance.',
        timestamp: new Date('2024-01-02T10:00:30Z'),
        metadata: {
          model: 'gpt-4o',
          provider: 'openai',
          trustScore: 0.95,
          verified: true
        }
      }
    ],
    agents: [],
    createdAt: new Date('2024-01-02T10:00:00Z'),
    updatedAt: new Date('2024-01-02T10:01:00Z')
  },
  {
    _id: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef3'),
    user: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef0'),
    title: 'Demo: Multi-LLM Comparison',
    messages: [
      {
        sender: 'user', 
        content: 'Compare responses from different AI models for enterprise decision making',
        timestamp: new Date('2024-01-02T11:00:00Z')
      },
      {
        sender: 'assistant',
        content: 'This platform integrates multiple LLM providers (OpenAI, Anthropic, Perplexity) allowing you to:\n\n1. **Cost Optimization** - Route queries to the most cost-effective model\n2. **Quality Comparison** - A/B test different models for your specific use case\n3. **Redundancy** - Fallback options if one provider is unavailable\n4. **Trust Verification** - All responses are cryptographically signed and auditable\n\nEach interaction is logged with full provenance for enterprise compliance.',
        timestamp: new Date('2024-01-02T11:00:45Z'),
        metadata: {
          model: 'claude-3-sonnet',
          provider: 'anthropic',
          trustScore: 0.98,
          verified: true
        }
      }
    ],
    agents: [],
    createdAt: new Date('2024-01-02T11:00:00Z'),
    updatedAt: new Date('2024-01-02T11:01:00Z')
  }
];

const demoTrustDeclarations = [
  {
    _id: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef4'),
    agent_id: 'demo-agent-001',
    agent_name: 'Demo Trust Agent',
    declaration_date: new Date('2024-01-01T00:00:00Z'),
    trust_articles: {
      truthfulness: true,
      reliability: true,
      transparency: true,
      accountability: true,
      privacy: true,
      security: true
    },
    compliance_score: 95,
    guilt_score: 5,
    audit_history: [
      {
        date: new Date('2024-01-01T00:00:00Z'),
        auditor: 'system',
        result: 'PASSED',
        notes: 'Initial trust declaration'
      }
    ]
  }
];

const demoInteractionEvents = [
  {
    _id: new mongoose.Types.ObjectId('65a1b2c3d4e5f6789abcdef5'),
    event_id: 'demo-event-001',
    session_id: 'demo-session-001',
    user: 'demo@symbi-trust.com',
    model_vendor: 'openai',
    model_name: 'gpt-4o',
    timestamp: new Date('2024-01-02T10:00:00Z'),
    prompt: 'Can you explain how cryptographic trust works in AI systems?',
    response: 'Cryptographic trust in AI systems involves creating verifiable proof...',
    metadata: {
      tokens_used: 150,
      response_time_ms: 2500,
      cost_usd: 0.002
    },
    analysis: {
      sentiment: 0.8,
      formality: 0.9,
      safety_flags: [],
      pivot_detected: false
    },
    ledger: {
      prev_hash: null,
      row_hash: 'a1b2c3d4e5f6789012345678901234567890abcdef',
      signature: 'demo-signature-placeholder'
    }
  }
];

module.exports = {
  demoUsers,
  demoConversations, 
  demoTrustDeclarations,
  demoInteractionEvents
};