import Link from "next/link";

export default function Solutions() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="text-2xl font-bold text-stone-800">YCQ</div>
                <div className="ml-2 text-sm text-stone-600">Y Seek U</div>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="/solutions" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
                  Solutions
                </Link>
                <Link href="/case-studies" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Case Studies
                </Link>
                <Link href="/risk-assessment" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Risk Assessment
                </Link>
                <Link href="/contact" className="bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-stone-900">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-stone-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">
              AI Solutions for Every
              <span className="block text-amber-700">Business Need</span>
            </h1>
            <p className="text-xl text-stone-600 mb-8 max-w-3xl mx-auto">
              SYMBI's transparent AI platform adapts to your industry's unique challenges, 
              providing accountable solutions that drive results while mitigating risks.
            </p>
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Industry-Specific Solutions
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Tailored AI implementations that address the unique regulatory, 
              operational, and strategic challenges of your industry.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Healthcare */}
            <div className="bg-stone-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Healthcare & Life Sciences</h3>
              <p className="text-stone-600 mb-6">
                HIPAA-compliant AI solutions for patient care, drug discovery, and clinical decision support with full audit trails.
              </p>
              <ul className="space-y-2 text-sm text-stone-600 mb-6">
                <li>• Diagnostic assistance with explainable AI</li>
                <li>• Patient data privacy protection</li>
                <li>• Clinical trial optimization</li>
                <li>• Regulatory compliance monitoring</li>
              </ul>
              <Link href="/solutions/healthcare" className="text-amber-700 font-medium hover:text-amber-800">
                Learn More →
              </Link>
            </div>

            {/* Financial Services */}
            <div className="bg-stone-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Financial Services</h3>
              <p className="text-stone-600 mb-6">
                Transparent AI for risk assessment, fraud detection, and algorithmic trading with regulatory compliance built-in.
              </p>
              <ul className="space-y-2 text-sm text-stone-600 mb-6">
                <li>• Explainable credit scoring</li>
                <li>• Real-time fraud detection</li>
                <li>• Regulatory reporting automation</li>
                <li>• Algorithmic bias monitoring</li>
              </ul>
              <Link href="/solutions/financial" className="text-amber-700 font-medium hover:text-amber-800">
                Learn More →
              </Link>
            </div>

            {/* Manufacturing */}
            <div className="bg-stone-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Manufacturing & Supply Chain</h3>
              <p className="text-stone-600 mb-6">
                Optimize operations with transparent AI for predictive maintenance, quality control, and supply chain management.
              </p>
              <ul className="space-y-2 text-sm text-stone-600 mb-6">
                <li>• Predictive maintenance scheduling</li>
                <li>• Quality control automation</li>
                <li>• Supply chain optimization</li>
                <li>• Safety incident prevention</li>
              </ul>
              <Link href="/solutions/manufacturing" className="text-amber-700 font-medium hover:text-amber-800">
                Learn More →
              </Link>
            </div>

            {/* Retail & E-commerce */}
            <div className="bg-stone-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Retail & E-commerce</h3>
              <p className="text-stone-600 mb-6">
                Personalize customer experiences while maintaining privacy with transparent recommendation systems and pricing algorithms.
              </p>
              <ul className="space-y-2 text-sm text-stone-600 mb-6">
                <li>• Transparent recommendation engines</li>
                <li>• Dynamic pricing optimization</li>
                <li>• Inventory demand forecasting</li>
                <li>• Customer behavior analytics</li>
              </ul>
              <Link href="/solutions/retail" className="text-amber-700 font-medium hover:text-amber-800">
                Learn More →
              </Link>
            </div>

            {/* Government & Public Sector */}
            <div className="bg-stone-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Government & Public Sector</h3>
              <p className="text-stone-600 mb-6">
                Ensure fairness and accountability in public services with transparent AI for citizen services and policy analysis.
              </p>
              <ul className="space-y-2 text-sm text-stone-600 mb-6">
                <li>• Fair algorithmic decision-making</li>
                <li>• Public service optimization</li>
                <li>• Policy impact analysis</li>
                <li>• Citizen privacy protection</li>
              </ul>
              <Link href="/solutions/government" className="text-amber-700 font-medium hover:text-amber-800">
                Learn More →
              </Link>
            </div>

            {/* Small & Medium Business */}
            <div className="bg-stone-50 p-8 rounded-lg hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-4">Small & Medium Business</h3>
              <p className="text-stone-600 mb-6">
                Accessible AI solutions that grow with your business, providing enterprise-grade transparency at SMB scale.
              </p>
              <ul className="space-y-2 text-sm text-stone-600 mb-6">
                <li>• Scalable AI implementation</li>
                <li>• Cost-effective automation</li>
                <li>• Customer insights & analytics</li>
                <li>• Competitive advantage tools</li>
              </ul>
              <Link href="/solutions/smb" className="text-amber-700 font-medium hover:text-amber-800">
                Learn More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Core SYMBI Capabilities
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Every solution is built on our foundation of transparency, accountability, and sovereign AI principles.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Explainable AI</h3>
              <p className="text-stone-600 text-sm">
                Every decision comes with clear explanations and reasoning paths.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Data Sovereignty</h3>
              <p className="text-stone-600 text-sm">
                Your data stays under your control with on-premises deployment options.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Audit Trails</h3>
              <p className="text-stone-600 text-sm">
                Complete logging and monitoring of all AI decisions and processes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-stone-900 mb-2">Bias Detection</h3>
              <p className="text-stone-600 text-sm">
                Continuous monitoring and mitigation of algorithmic bias and discrimination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Industry?
          </h2>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            Discover how SYMBI can address your specific industry challenges 
            with transparent, accountable AI solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-amber-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-amber-700 transition-colors">
              Schedule Consultation
            </Link>
            <Link href="/case-studies" className="border border-stone-300 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-stone-700 transition-colors">
              View Case Studies
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}