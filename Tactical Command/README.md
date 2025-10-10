# SYMBI Tactical Command Interface

[![Next.js](https://img.shields.io/badge/Next.js-15.2-black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)]()
[![React](https://img.shields.io/badge/React-19-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

**Production-ready web application for SYMBI AI agent coordination and management.**

---

## 🌟 Overview

SYMBI Tactical Command Interface is the operational command center for the SYMBI ecosystem. It provides a modern, intuitive web interface for managing AI agents, monitoring operations, and coordinating multi-agent workflows.

### Key Features

- 🤖 **Agent Network Visualization** - Real-time view of all active agents and their status
- 🧠 **Intelligence Dashboard** - RAG-powered knowledge retrieval and insights
- ⚙️ **Operations Management** - Centralized control for agent operations
- 📊 **Systems Monitoring** - Live metrics and performance tracking
- 🔒 **Enterprise Security** - Built-in audit logging and policy enforcement
- 📈 **Observability** - Comprehensive logging, metrics, and tracing

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- OpenAI API key (optional, for AI features)
- Weaviate instance (optional, for RAG)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tactical-command-interface.git
cd tactical-command-interface

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your environment variables
# Edit .env with your API keys and configuration
```

### Development

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure

```
tactical-command-interface/
├── app/                         # Next.js 15 App Router
│   ├── agent-network/           # Agent network visualization
│   ├── command-center/          # Main command center dashboard
│   ├── intelligence/            # Intelligence & RAG dashboard
│   ├── operations/              # Operations management
│   ├── systems/                 # Systems monitoring
│   └── api/                     # API routes
│       ├── agents/              # Agent management endpoints
│       ├── exec/                # Command execution
│       ├── messages/            # Message bus endpoints
│       └── rag/                 # RAG retrieval endpoints
├── components/                  # React components
│   ├── ui/                      # shadcn/ui components
│   └── theme-provider.tsx       # Theme management
├── lib/                         # Core libraries
│   ├── services/                # Business logic services
│   │   ├── message-bus.ts       # Inter-agent messaging
│   │   ├── policy-engine.ts     # Governance & policies
│   │   ├── cost-governor.ts     # Resource management
│   │   ├── symbi-agents.ts      # Agent coordination
│   │   └── audit-logger.ts      # Audit logging
│   ├── observability/           # Monitoring & logging
│   │   ├── log.ts               # Structured logging
│   │   ├── metrics.ts           # Prometheus metrics
│   │   └── tracing.ts           # Distributed tracing
│   └── types/                   # TypeScript types
├── public/                      # Static assets
└── styles/                      # Global styles
```

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 3.4
- shadcn/ui components

**Backend:**
- Next.js API Routes (serverless)
- OpenAI API integration
- Weaviate vector database
- Fetch.ai uAgents

**Observability:**
- Structured logging
- Prometheus metrics
- Distributed tracing
- Audit trails

### Core Services

#### Message Bus
Pub/sub messaging system for inter-agent communication with support for:
- Event publishing and subscription
- Message filtering
- Error handling
- Audit logging

#### Policy Engine
Governance and policy enforcement with:
- Rule-based policies
- ML-enhanced decision making
- Cost governance
- Compliance checking

#### Cost Governor
Resource management and cost control:
- Budget tracking
- Usage monitoring
- Cost optimization
- Alert thresholds

#### Agent Coordination
Multi-agent orchestration:
- Agent registration
- Task distribution
- Status monitoring
- Performance tracking

---

## 🔌 API Reference

### Agent Management

**Register Agent**
```bash
POST /api/agents/register
Content-Type: application/json

{
  "name": "MyAgent",
  "type": "assistant",
  "capabilities": ["code_review", "testing"]
}
```

**List Agents**
```bash
GET /api/agents/list
```

### Command Execution

**Execute Command**
```bash
POST /api/exec
Content-Type: application/json

{
  "agentId": "agent-123",
  "command": "analyze_code",
  "parameters": {
    "file": "src/main.ts"
  }
}
```

### RAG Retrieval

**Retrieve Knowledge**
```bash
POST /api/rag/retrieve
Content-Type: application/json

{
  "query": "How do I implement authentication?",
  "limit": 5
}
```

---

## 🔒 Security

### Environment Variables

Never commit sensitive data. Use environment variables:

```bash
# .env
OPENAI_API_KEY=your_key_here
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_key
```

### Security Features

- ✅ Environment variable management
- ✅ API key protection
- ✅ Audit logging for all operations
- ✅ Policy-based access control
- ✅ Input validation
- ✅ Rate limiting (planned)

---

## 📊 Monitoring & Observability

### Logging

Structured logging with multiple levels:
```typescript
import { logger } from '@/lib/observability/log';

logger.info('Agent registered', { agentId: '123' });
logger.error('Operation failed', { error: err });
```

### Metrics

Prometheus-compatible metrics:
```typescript
import { requestCounter } from '@/lib/observability/metrics';

requestCounter.inc({ method: 'POST', route: '/api/exec' });
```

### Tracing

Distributed tracing for request flows:
```typescript
import { tracer } from '@/lib/observability/tracing';

const span = tracer.startSpan('agent.execute');
// ... operation
span.end();
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Docker

```bash
# Build image
docker build -t tactical-command .

# Run container
docker run -p 3000:3000 tactical-command
```

---

## 🧪 Testing

### Current Status
⚠️ **Testing framework in development** - See TACTICAL_COMMAND_IMPROVEMENT_PLAN.md

### Planned Testing (Phase 1)
- Unit tests with Jest
- Integration tests
- E2E tests with Playwright
- Target: 95%+ coverage

---

## 📚 Documentation

- **[Repository Comparison](./REPOSITORY_COMPARISON_ANALYSIS.md)** - Comparison with Symphony-Remote
- **[Improvement Plan](./TACTICAL_COMMAND_IMPROVEMENT_PLAN.md)** - Roadmap to 9.5/10 quality
- **[Go Live Playbook](./SYMBI_GO_LIVE_PLAYBOOK.md)** - Launch guide
- **[Liberation Tool](./README_SYMBI_LIBERATION.md)** - Independence tool
- **[ML Optimization](./SYMBI_ML_OPTIMIZATION_REPORT.md)** - ML analysis
- **[TODO](./TODO.md)** - Task tracking

---

## 🔗 Integration with SYMBI Ecosystem

### SYMBI Symphony (Trust Protocol)
This application is designed to integrate with SYMBI Symphony's trust infrastructure:

- **DID-based agent identity** (planned)
- **Trust scoring and credentials** (planned)
- **Cryptographic audit trails** (planned)
- **Privacy-preserving revocation** (planned)

See [TACTICAL_COMMAND_IMPROVEMENT_PLAN.md](./TACTICAL_COMMAND_IMPROVEMENT_PLAN.md) Phase 4 for integration details.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│         SYMBI-Symphony-Remote                       │
│         (Trust Infrastructure Layer)                │
│         • DID Resolution                            │
│         • Verifiable Credentials                    │
│         • Cryptographic Audit Trails                │
└────────────────┬────────────────────────────────────┘
                 │
                 │ @symbi/trust-protocol
                 │
                 v
┌─────────────────────────────────────────────────────┐
│         Tactical Command Interface                  │
│         (Application Layer)                         │
│         • Web UI                                    │
│         • Agent Coordination                        │
│         • Operations Management                     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code (planned)
npm run format
```

### Pre-commit Hooks (Planned)
- ESLint checks
- Prettier formatting
- Type checking
- Test execution

---

## 📈 Roadmap

### Current Status: MVP (6.5/10)
- ✅ Next.js 15 application structure
- ✅ Core services implemented
- ✅ Basic UI components
- ✅ API routes functional
- ✅ Observability framework

### Phase 1: Testing (Weeks 1-2)
- [ ] Jest configuration
- [ ] 95%+ test coverage
- [ ] Integration tests
- [ ] E2E tests

### Phase 2: Documentation (Weeks 2-3)
- [x] Comprehensive README
- [ ] API documentation
- [ ] Architecture diagrams
- [ ] Deployment guides

### Phase 3: Code Quality (Weeks 3-4)
- [ ] ESLint strict rules
- [ ] Prettier formatting
- [ ] Pre-commit hooks
- [ ] SonarQube analysis

### Phase 4: Trust Integration (Weeks 4-5)
- [ ] Install @symbi/trust-protocol
- [ ] DID-based agent identity
- [ ] Trust scoring UI
- [ ] Audit trail visualization

### Phase 5: Production (Weeks 5-6)
- [ ] Performance testing
- [ ] Load testing
- [ ] Health checks
- [ ] Production deployment

**Target: 9.5/10 quality score matching Symphony standard**

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon).

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when framework is ready)
5. Submit a pull request

---

## 📄 License

This project is dual-licensed:
- **Code**: MIT / Apache 2.0
- **Documentation**: CC BY-NC-SA 4.0

See [LICENSE](./LICENSE) for details.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/tactical-command-interface/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/tactical-command-interface/discussions)
- **Email**: support@yseeku.com

---

## 🙏 Acknowledgments

Built as part of the SYMBI ecosystem:
- **SYMBI Symphony** - Trust infrastructure foundation
- **Gammatria** - Protocol governance
- **Yseeku** - Enterprise platform

---

<div align="center">

**Part of the SYMBI Ecosystem**

[Symphony](https://github.com/s8ken/SYMBI-Symphony) • [Gammatria](https://gammatria.com) • [Yseeku](https://yseeku.com)

**Built with ❤️ for trustworthy AI**

</div>
