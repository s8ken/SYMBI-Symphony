import Link from "next/link";

export default function Investors() {
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
                <Link href="/technology" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Technology
                </Link>
                <Link href="/investors" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
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
              Investment Opportunity
            </h1>
            <h2 className="text-2xl md:text-3xl text-amber-700 mb-6 font-semibold">
              AI Trust Infrastructure Market Leader
            </h2>
            <p className="text-xl text-stone-600 mb-8 max-w-3xl mx-auto">
              YCQ Sonate is positioned to capture significant market share in the rapidly expanding AI trust and compliance infrastructure market.
            </p>
          </div>
        </div>
      </section>

      {/* Market Opportunity */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Market Opportunity
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              The AI trust and compliance market represents a massive opportunity driven by regulatory requirements, enterprise adoption, and risk management needs.
            </p>
          </div>

          {/* Market Size Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-blue-50 p-8 rounded-lg text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$62B</div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Total Addressable Market</h3>
              <p className="text-stone-600">
                AI governance, compliance, and trust infrastructure across enterprise segments
              </p>
            </div>
            
            <div className="bg-green-50 p-8 rounded-lg text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">$18B</div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Serviceable Addressable Market</h3>
              <p className="text-stone-600">
                Enterprise AI operations requiring audit trails, compliance reporting, and risk management
              </p>
            </div>
            
            <div className="bg-amber-50 p-8 rounded-lg text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2">$2.1B</div>
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Serviceable Obtainable Market</h3>
              <p className="text-stone-600">
                Organizations with immediate need for cryptographic audit trails and AI trust verification
              </p>
            </div>
          </div>

          {/* Market Drivers */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-stone-900 text-center mb-12">Market Drivers</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-stone-900 mb-2">Regulatory Pressure</h4>
                <p className="text-stone-600 text-sm">EU AI Act, SEC disclosure requirements, and industry-specific regulations driving compliance needs</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-stone-900 mb-2">AI Adoption Surge</h4>
                <p className="text-stone-600 text-sm">Enterprise AI spending growing 35% YoY, creating immediate need for governance infrastructure</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-stone-900 mb-2">Trust & Safety</h4>
                <p className="text-stone-600 text-sm">High-profile AI incidents driving demand for verifiable audit trails and risk management</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-stone-900 mb-2">Enterprise Scale</h4>
                <p className="text-stone-600 text-sm">Large enterprises deploying AI across multiple business units, requiring centralized governance</p>
              </div>
            </div>
          </div>

          {/* Competitive Positioning */}
          <div className="bg-stone-50 p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-stone-900 text-center mb-8">Competitive Positioning</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-semibold text-stone-900 mb-4">Existing Solutions</h4>
                <ul className="space-y-3 text-stone-600">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">×</span>
                    <span>Governance-only tools without execution integration</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">×</span>
                    <span>Single-vendor solutions lacking multi-model support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">×</span>
                    <span>Complex implementations requiring months of setup</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">×</span>
                    <span>Limited audit capabilities, no cryptographic verification</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-xl font-semibold text-stone-900 mb-4">YCQ Sonate Advantages</h4>
                <ul className="space-y-3 text-stone-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Full-stack solution: governance + execution + audit</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Vendor-agnostic: OpenAI, Anthropic, custom models</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Plug-and-play deployment in existing infrastructure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Cryptographic audit trails with one-click verification</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Model */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Revenue Model
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Multiple revenue streams designed to scale with enterprise AI adoption
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-stone-900 mb-3">SaaS Platform</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">$50K-500K</div>
              <p className="text-sm text-stone-600 mb-4">Annual recurring revenue per enterprise customer</p>
              <ul className="text-stone-600 text-sm space-y-1">
                <li>• Tiered pricing by AI transaction volume</li>
                <li>• Premium features for compliance reporting</li>
                <li>• Multi-tenant deployment options</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Professional Services</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">$100K-2M</div>
              <p className="text-sm text-stone-600 mb-4">Implementation and integration services</p>
              <ul className="text-stone-600 text-sm space-y-1">
                <li>• Custom integration and deployment</li>
                <li>• Training and change management</li>
                <li>• Ongoing support and optimization</li>
              </ul>
            </div>

            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-stone-900 mb-3">Enterprise Licensing</h3>
              <div className="text-3xl font-bold text-amber-600 mb-2">$1M+</div>
              <p className="text-sm text-stone-600 mb-4">On-premises and private cloud deployments</p>
              <ul className="text-stone-600 text-sm space-y-1">
                <li>• White-label solutions for vendors</li>
                <li>• Custom compliance frameworks</li>
                <li>• Dedicated support and SLAs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Highlights */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Investment Highlights
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Strong fundamentals and exceptional execution capability
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-stone-900 mb-6">Technical Achievement</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Development Timeline</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium">7 months</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Lines of Code</span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-medium">18,000+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">API Endpoints</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded font-medium">18+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Test Coverage</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium">95%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">Security Grade</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded font-medium">A+</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold text-stone-900 mb-6">Market Timing</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900">Regulatory Tailwinds</h4>
                    <p className="text-stone-600 text-sm">EU AI Act compliance requirements creating immediate demand</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900">Enterprise Readiness</h4>
                    <p className="text-stone-600 text-sm">Production-ready platform when competitors are still in development</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900">First-Mover Advantage</h4>
                    <p className="text-stone-600 text-sm">Unique positioning in cryptographic AI audit infrastructure</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Ask */}
      <section className="py-20 bg-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Lead the AI Trust Revolution?
          </h2>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            Join us in building the infrastructure that will govern the next generation of enterprise AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="mailto:stephen@yseeku.com?subject=Investment Discussion - YCQ Sonate" className="bg-amber-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-amber-700 transition-colors">
              Schedule Investment Discussion
            </Link>
            <Link href="https://symbi-synergy-pa9k82n5m-ycq.vercel.app" target="_blank" className="border border-stone-300 text-stone-300 px-8 py-3 rounded-md text-lg font-medium hover:bg-stone-700 transition-colors">
              Experience Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}