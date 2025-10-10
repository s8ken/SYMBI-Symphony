import Link from "next/link";

export default function Technology() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-stone-800">YCQ Sonate</Link>
              <div className="ml-2 text-sm text-stone-600">Why Seek You</div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="/#platform" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Platform
                </Link>
                <Link href="/technology" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
                  Technology
                </Link>
                <Link href="/investors" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Investors
                </Link>
                <Link href="/#demo" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Demo
                </Link>
                <Link href="https://symbi-synergy-pa9k82n5m-ycq.vercel.app" target="_blank" className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-900">
                  Live Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-stone-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-stone-900 mb-4">
              Technology Stack
            </h1>
            <h2 className="text-2xl md:text-3xl text-amber-700 mb-6 font-semibold">
              Enterprise-grade AI trust infrastructure
            </h2>
            <p className="text-xl text-stone-600 mb-8 max-w-3xl mx-auto">
              Built for both uncompromising security and exceptional developer experience. Every component designed for scale, auditability, and ease of integration.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Four-Module Architecture
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Modular design enabling selective deployment and seamless integration with existing enterprise infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Sonate Ledger</h3>
              <p className="text-stone-600 text-sm">Cryptographic audit trails with Ed25519 signatures and hash-chain verification</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Sonate Guardrails</h3>
              <p className="text-stone-600 text-sm">Policy enforcement and multi-provider orchestration with unified API</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Sonate Roundtable</h3>
              <p className="text-stone-600 text-sm">Fairness-aware QA, behavioral analysis, and trust scoring algorithms</p>
            </div>

            <div className="bg-amber-50 p-6 rounded-lg text-center">
              <div className="w-16 h-16 bg-amber-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0a2 2 0 002 2v2a2 2 0 01-2 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">Sonate Capsules</h3>
              <p className="text-stone-600 text-sm">Context orchestration with semantic search and goal-driven optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Audit Focus */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Security & Audit Infrastructure
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Built from the ground up with cryptographic verification, immutable audit trails, and enterprise security standards
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold text-stone-900 mb-6">Cryptographic Foundation</h3>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1 mr-4">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-2">Ed25519 Digital Signatures</h4>
                      <p className="text-stone-600 text-sm">Every AI interaction cryptographically signed with tamper-evident verification</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1 mr-4">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-2">Hash-Chain Verification</h4>
                      <p className="text-stone-600 text-sm">Append-only ledger with cryptographic linking for immutable audit trails</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1 mr-4">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-2">One-Click Integrity Verification</h4>
                      <p className="text-stone-600 text-sm">Instant verification of complete AI interaction history with mathematical proof</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-stone-900 mb-6">Enterprise Security</h3>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mt-1 mr-4">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-2">JWT/RBAC Authentication</h4>
                      <p className="text-stone-600 text-sm">Role-based access control with JSON Web Tokens and session management</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mt-1 mr-4">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-2">Webhook HMAC Verification</h4>
                      <p className="text-stone-600 text-sm">Cryptographically verified webhooks ensuring data integrity in transit</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mt-1 mr-4">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-stone-900 mb-2">Zero Client-Side Secrets</h4>
                      <p className="text-stone-600 text-sm">All API keys and sensitive data server-side only, never exposed to client</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Experience */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Exceptional Developer Experience
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Enterprise security doesn't mean complex integration. Built for developers who value both security and simplicity.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-stone-900 mb-6">Modern Development Stack</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">Node.js</div>
                  <div className="text-sm text-stone-600">Runtime</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">Express</div>
                  <div className="text-sm text-stone-600">Framework</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-1">MongoDB</div>
                  <div className="text-sm text-stone-600">Database</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-orange-600 mb-1">Redis</div>
                  <div className="text-sm text-stone-600">Cache & Queue</div>
                </div>
                <div className="bg-cyan-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cyan-600 mb-1">React</div>
                  <div className="text-sm text-stone-600">Frontend</div>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-pink-600 mb-1">Socket.IO</div>
                  <div className="text-sm text-stone-600">Real-time</div>
                </div>
              </div>
            </div>

            <div className="bg-stone-900 p-8 rounded-lg text-white">
              <h4 className="text-lg font-semibold mb-4">Quick Integration Example</h4>
              <pre className="text-sm text-green-400 overflow-x-auto">
{`// Initialize YCQ Sonate client
const ycq = new YCQSonate({
  apiKey: process.env.YCQ_API_KEY,
  endpoint: 'https://api.ycqsonate.com'
});

// Execute AI request with audit trail
const result = await ycq.chat({
  model: 'gpt-4',
  messages: [{
    role: 'user', 
    content: 'Analyze this document'
  }],
  auditOptions: {
    cryptographicSigning: true,
    complianceFramework: 'SOC2'
  }
});

// Verify integrity later
const verification = await ycq.verify(
  result.auditTrail.hash
);
console.log(verification.isValid); // true`}
              </pre>
            </div>
          </div>

          {/* API & Integration Features */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-stone-900 mb-3">RESTful APIs</h4>
              <p className="text-stone-600">
                18+ documented endpoints with OpenAPI spec, comprehensive error handling, and rate limiting
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-stone-900 mb-3">Multi-Provider Support</h4>
              <p className="text-stone-600">
                Unified API across OpenAI, Anthropic, Perplexity, and custom models with automatic failover
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold text-stone-900 mb-3">SDK & Extensions</h4>
              <p className="text-stone-600">
                VS Code extension for development, comprehensive SDKs, and integration templates
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure & Operations */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Production-Ready Infrastructure
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Built for enterprise scale with comprehensive monitoring, observability, and operational excellence
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-stone-900 mb-6">Monitoring & Observability</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Prometheus Metrics</span>
                    <span className="text-stone-600 ml-2">- Custom metrics with /metrics endpoint</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Structured Logging</span>
                    <span className="text-stone-600 ml-2">- JSON logs with correlation IDs</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Grafana Dashboards</span>
                    <span className="text-stone-600 ml-2">- Real-time system and business metrics</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Health Checks</span>
                    <span className="text-stone-600 ml-2">- /healthz and /readyz endpoints</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold text-stone-900 mb-6">Operational Excellence</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Queue Management</span>
                    <span className="text-stone-600 ml-2">- BullMQ for reliable task processing</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Automated Testing</span>
                    <span className="text-stone-600 ml-2">- 95% test coverage with Jest integration</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">CI/CD Pipeline</span>
                    <span className="text-stone-600 ml-2">- Automated deployment and rollback</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-semibold text-stone-900">Performance</span>
                    <span className="text-stone-600 ml-2">- ~100ms response time with async processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Results */}
          <div className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg">
            <h4 className="text-2xl font-bold text-stone-900 text-center mb-8">Validation Results</h4>
            <div className="text-center mb-6">
              <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">94.9% Pass Rate Across 59 Tests</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-stone-900 mb-2">Auth & Trust ✅</h5>
                <p className="text-stone-600 text-sm">Authentication, authorization, and cryptographic verification all passing</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-stone-900 mb-2">Security ✅</h5>
                <p className="text-stone-600 text-sm">All security controls, rate limiting, and data validation verified</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-stone-900 mb-2">Multi-LLM ⚠️</h5>
                <p className="text-stone-600 text-sm">API keys required for full external provider testing</p>
              </div>
            </div>
            
            <div className="text-center mt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/YCQ_Sonate_UAT_Report.md" download className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
                  📄 Download UAT Report
                </a>
                <a href="/YCQ_Sonate_API_Collection.json" download className="border border-stone-300 text-stone-700 px-6 py-3 rounded-md font-medium hover:bg-stone-50 transition-colors">
                  🔧 Download Postman Collection
                </a>
              </div>
              <p className="text-stone-600 text-sm mt-4">
                Complete test results and API collection for technical evaluation. Import collection into Postman for interactive API testing.
              </p>
            </div>
          </div>

          {/* Technical Stats */}
          <div className="mt-8 bg-white p-8 rounded-lg shadow-sm">
            <h4 className="text-xl font-semibold text-stone-900 text-center mb-8">Technical Achievement Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600">18,000+</div>
                <div className="text-sm text-stone-600">Lines of Code</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">95%</div>
                <div className="text-sm text-stone-600">Test Coverage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">18+</div>
                <div className="text-sm text-stone-600">API Endpoints</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-orange-600">A+</div>
                <div className="text-sm text-stone-600">Security Grade</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-cyan-600">~100ms</div>
                <div className="text-sm text-stone-600">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation & Support */}
      <section className="py-20 bg-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Build with YCQ Sonate?
          </h2>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            Comprehensive documentation, SDKs, and developer tools to get you started in minutes, not months.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://symbi-synergy-pa9k82n5m-ycq.vercel.app" target="_blank" className="bg-amber-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-amber-700 transition-colors">
              Try Live Demo
            </Link>
            <Link href="mailto:stephen@yseeku.com?subject=Technical Integration Discussion" className="border border-stone-300 text-stone-300 px-8 py-3 rounded-md text-lg font-medium hover:bg-stone-700 transition-colors">
              Technical Discussion
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}