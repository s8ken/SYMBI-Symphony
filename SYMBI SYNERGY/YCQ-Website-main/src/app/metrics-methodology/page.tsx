import Link from "next/link";

export default function MetricsMethodology() {
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Metrics Methodology
            </h1>
            <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
              Understanding YCQ Sonate's fairness-aware metrics and trust scoring methodology
            </p>
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Platform Overview
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-8">Core Metrics Explained</h2>
            
            <div className="space-y-8">
              {/* FAR-A / FAR-H */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">FAR</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">FAR-A / FAR-H</h3>
                    <p className="text-stone-700 font-medium">First-Attempt Resolution (AI-only vs Human-involved)</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Definition</h4>
                    <p className="text-stone-600 text-sm mb-4">
                      Percentage of interactions resolved without requiring follow-up or escalation, measured separately for AI-only flows (FAR-A) and flows involving human intervention (FAR-H).
                    </p>
                    <h4 className="font-semibold text-stone-900 mb-2">Sample Calculation</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p><strong>FAR-A:</strong> 440 AI-resolved / 500 AI-only attempts = 88%</p>
                      <p><strong>FAR-H:</strong> 168 human-resolved / 200 escalated cases = 84%</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Why This Matters</h4>
                    <ul className="text-stone-600 text-sm space-y-1">
                      <li>• Prevents penalizing humans for handling complex cases</li>
                      <li>• Shows true AI capability vs human expertise value</li>
                      <li>• Enables fair performance comparisons</li>
                      <li>• Identifies optimal AI/human collaboration patterns</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* LOI */}
              <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">LOI</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">LOI</h3>
                    <p className="text-stone-700 font-medium">Learning Opportunity Index</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Definition</h4>
                    <p className="text-stone-600 text-sm mb-4">
                      Measures routine task volume removed per human worker, allowing focus on high-value activities that develop skills and expertise.
                    </p>
                    <h4 className="font-semibold text-stone-900 mb-2">Sample Calculation</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p><strong>Before AI:</strong> 120 routine tasks/day per person</p>
                      <p><strong>After AI:</strong> 35 routine tasks/day per person</p>
                      <p><strong>LOI:</strong> (120-35)/120 = 71% routine work automated</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Business Impact</h4>
                    <ul className="text-stone-600 text-sm space-y-1">
                      <li>• Measures human role evolution, not replacement</li>
                      <li>• Quantifies upskilling opportunities created</li>
                      <li>• Tracks productivity gains from AI augmentation</li>
                      <li>• Supports workforce development planning</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* PFI */}
              <div className="bg-amber-50 p-6 rounded-lg">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">PFI</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">PFI</h3>
                    <p className="text-stone-700 font-medium">Process Fairness Index</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Definition</h4>
                    <p className="text-stone-600 text-sm mb-4">
                      Fairness-adjusted performance score that accounts for complexity mix and learning opportunities. Normalizes performance metrics based on case difficulty distribution.
                    </p>
                    <h4 className="font-semibold text-stone-900 mb-2">Sample Calculation</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p><strong>Raw Performance:</strong> 75% success rate</p>
                      <p><strong>Complexity Adjustment:</strong> +8% (high-difficulty cases)</p>
                      <p><strong>Learning Factor:</strong> +10% (skill development value)</p>
                      <p><strong>PFI Score:</strong> 1.18× baseline performance</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Fairness Principles</h4>
                    <ul className="text-stone-600 text-sm space-y-1">
                      <li>• Accounts for case complexity distribution</li>
                      <li>• Recognizes learning and development value</li>
                      <li>• Prevents discrimination against expertise areas</li>
                      <li>• Enables fair AI/human performance comparison</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* TIS */}
              <div className="bg-purple-50 p-6 rounded-lg">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">TIS</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-stone-900 mb-2">TIS</h3>
                    <p className="text-stone-700 font-medium">Trust Integrity Score</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Definition</h4>
                    <p className="text-stone-600 text-sm mb-4">
                      Percentage of sampled AI interactions whose complete hash-chain verified successfully, proving cryptographic integrity of the audit trail.
                    </p>
                    <h4 className="font-semibold text-stone-900 mb-2">Sample Calculation</h4>
                    <div className="bg-white p-3 rounded border text-sm">
                      <p><strong>Sampled Sessions:</strong> 1,000 interactions</p>
                      <p><strong>Hash Verification Passed:</strong> 993 interactions</p>
                      <p><strong>Hash Verification Failed:</strong> 7 interactions</p>
                      <p><strong>TIS Score:</strong> 993/1000 = 99.3%</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900 mb-2">Trust Assurance</h4>
                    <ul className="text-stone-600 text-sm space-y-1">
                      <li>• Mathematical proof of data integrity</li>
                      <li>• Tamper detection for audit compliance</li>
                      <li>• Cryptographic verification of AI decisions</li>
                      <li>• Immutable evidence for regulatory reporting</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Methodology & Assumptions */}
          <div className="bg-stone-50 p-8 rounded-lg mb-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Methodology & Assumptions</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Sample Data</h3>
                <ul className="text-stone-600 text-sm space-y-2">
                  <li>• <strong>Sample Size:</strong> 700 interactions over 30-day period</li>
                  <li>• <strong>AI-Only Sessions:</strong> 500 interactions</li>
                  <li>• <strong>Human-Involved Sessions:</strong> 200 interactions</li>
                  <li>• <strong>Complexity Distribution:</strong> 40% routine, 35% moderate, 25% complex</li>
                  <li>• <strong>Verification Sample:</strong> 1,000 hash-chain validations</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-stone-900 mb-4">Key Assumptions</h3>
                <ul className="text-stone-600 text-sm space-y-2">
                  <li>• Human escalation indicates higher case complexity</li>
                  <li>• Learning value increases with case complexity</li>
                  <li>• Routine tasks provide minimal skill development</li>
                  <li>• Hash-chain integrity ensures audit trail validity</li>
                  <li>• Performance normalization prevents bias against expertise</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-100 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Note on Sample Data</h4>
              <p className="text-amber-700 text-sm">
                Metrics shown are representative examples for demonstration purposes. Actual deployment metrics will vary based on use case, data volume, complexity distribution, and organizational context. YCQ Sonate provides customizable baseline calibration for each implementation.
              </p>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Additional Resources</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/technology" className="bg-stone-800 text-white px-6 py-3 rounded-md font-medium hover:bg-stone-900 transition-colors">
                Technical Implementation
              </Link>
              <Link href="https://symbi-synergy-pa9k82n5m-ycq.vercel.app" target="_blank" className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors">
                Live Demo & Verification
              </Link>
              <Link href="/investors" className="border border-stone-300 text-stone-700 px-6 py-3 rounded-md font-medium hover:bg-stone-50 transition-colors">
                Investment Overview
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}