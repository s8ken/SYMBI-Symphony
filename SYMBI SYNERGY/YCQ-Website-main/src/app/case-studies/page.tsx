import Link from "next/link";

export default function CaseStudies() {
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
                <Link href="/solutions" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Solutions
                </Link>
                <Link href="/case-studies" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
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
              Real Results from
              <span className="block text-amber-700">Transparent AI</span>
            </h1>
            <p className="text-xl text-stone-600 mb-8 max-w-3xl mx-auto">
              See how organizations across industries have successfully implemented 
              SYMBI's transparent AI solutions to drive growth while mitigating risks.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Case Study */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-stone-50 to-amber-50 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800 mb-4">
                  Featured Case Study
                </div>
                <h2 className="text-3xl font-bold text-stone-900 mb-4">
                  Regional Hospital Network Reduces Diagnostic Errors by 40%
                </h2>
                <p className="text-lg text-stone-600 mb-6">
                  A 12-hospital network implemented SYMBI's explainable AI for radiology diagnosis, 
                  achieving significant improvements in accuracy while maintaining full HIPAA compliance 
                  and providing clear audit trails for every decision.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-700">40%</div>
                    <div className="text-sm text-stone-600">Error Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-700">25%</div>
                    <div className="text-sm text-stone-600">Faster Diagnosis</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-700">100%</div>
                    <div className="text-sm text-stone-600">Audit Compliance</div>
                  </div>
                </div>
                <Link href="/case-studies/hospital-network" className="inline-flex items-center text-amber-700 font-medium hover:text-amber-800">
                  Read Full Case Study
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h4 className="font-semibold text-stone-900 mb-4">Implementation Highlights</h4>
                <ul className="space-y-3 text-stone-600">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Deployed across 12 hospitals in 6 months</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Zero patient data breaches or compliance issues</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>95% physician adoption rate within 3 months</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Complete explainability for all AI recommendations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Success Stories Across Industries
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              From startups to Fortune 500 companies, see how SYMBI delivers 
              measurable results while maintaining transparency and accountability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Financial Services Case */}
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Credit Union</h3>
                  <p className="text-sm text-stone-600">Financial Services</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-stone-900 mb-3">
                Transparent Credit Scoring Increases Approvals by 30%
              </h4>
              <p className="text-stone-600 mb-4">
                A regional credit union implemented SYMBI's explainable credit scoring system, 
                reducing bias while improving approval rates and member satisfaction.
              </p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-amber-700 font-medium">30% ↑ Approvals</span>
                <span className="text-green-700 font-medium">85% ↓ Bias</span>
                <span className="text-blue-700 font-medium">100% Explainable</span>
              </div>
              <Link href="/case-studies/credit-union" className="text-amber-700 font-medium hover:text-amber-800 text-sm">
                Read Case Study →
              </Link>
            </div>

            {/* Manufacturing Case */}
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Auto Parts Manufacturer</h3>
                  <p className="text-sm text-stone-600">Manufacturing</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-stone-900 mb-3">
                Predictive Maintenance Reduces Downtime by 60%
              </h4>
              <p className="text-stone-600 mb-4">
                A major auto parts manufacturer deployed SYMBI's transparent predictive maintenance 
                system, dramatically reducing unplanned downtime and maintenance costs.
              </p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-amber-700 font-medium">60% ↓ Downtime</span>
                <span className="text-green-700 font-medium">45% ↓ Costs</span>
                <span className="text-blue-700 font-medium">Real-time Alerts</span>
              </div>
              <Link href="/case-studies/manufacturing" className="text-amber-700 font-medium hover:text-amber-800 text-sm">
                Read Case Study →
              </Link>
            </div>

            {/* Retail Case */}
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">E-commerce Platform</h3>
                  <p className="text-sm text-stone-600">Retail</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-stone-900 mb-3">
                Transparent Recommendations Boost Sales by 35%
              </h4>
              <p className="text-stone-600 mb-4">
                An online retailer replaced black-box recommendations with SYMBI's explainable system, 
                improving customer trust and conversion rates while maintaining privacy.
              </p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-amber-700 font-medium">35% ↑ Sales</span>
                <span className="text-green-700 font-medium">90% ↑ Trust</span>
                <span className="text-blue-700 font-medium">Privacy First</span>
              </div>
              <Link href="/case-studies/ecommerce" className="text-amber-700 font-medium hover:text-amber-800 text-sm">
                Read Case Study →
              </Link>
            </div>

            {/* Government Case */}
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">City Government</h3>
                  <p className="text-sm text-stone-600">Public Sector</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-stone-900 mb-3">
                Fair Housing Algorithm Eliminates Discrimination
              </h4>
              <p className="text-stone-600 mb-4">
                A major city implemented SYMBI's transparent housing assistance algorithm, 
                ensuring fair distribution while maintaining complete accountability to citizens.
              </p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-amber-700 font-medium">0% Bias</span>
                <span className="text-green-700 font-medium">100% Fair</span>
                <span className="text-blue-700 font-medium">Full Audit</span>
              </div>
              <Link href="/case-studies/government" className="text-amber-700 font-medium hover:text-amber-800 text-sm">
                Read Case Study →
              </Link>
            </div>

            {/* SMB Case */}
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Tech Startup</h3>
                  <p className="text-sm text-stone-600">Small Business</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-stone-900 mb-3">
                Startup Scales Customer Support with Transparent AI
              </h4>
              <p className="text-stone-600 mb-4">
                A growing SaaS startup implemented SYMBI's explainable customer support AI, 
                scaling from 100 to 10,000 customers while maintaining personalized service.
              </p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-amber-700 font-medium">100x Scale</span>
                <span className="text-green-700 font-medium">95% Satisfaction</span>
                <span className="text-blue-700 font-medium">24/7 Support</span>
              </div>
              <Link href="/case-studies/startup" className="text-amber-700 font-medium hover:text-amber-800 text-sm">
                Read Case Study →
              </Link>
            </div>

            {/* Insurance Case */}
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Insurance Company</h3>
                  <p className="text-sm text-stone-600">Insurance</p>
                </div>
              </div>
              <h4 className="text-lg font-semibold text-stone-900 mb-3">
                Claims Processing Automation Reduces Fraud by 70%
              </h4>
              <p className="text-stone-600 mb-4">
                A regional insurer deployed SYMBI's transparent fraud detection system, 
                dramatically reducing fraudulent claims while speeding up legitimate payouts.
              </p>
              <div className="flex justify-between items-center text-sm mb-4">
                <span className="text-amber-700 font-medium">70% ↓ Fraud</span>
                <span className="text-green-700 font-medium">50% ↑ Speed</span>
                <span className="text-blue-700 font-medium">Clear Decisions</span>
              </div>
              <Link href="/case-studies/insurance" className="text-amber-700 font-medium hover:text-amber-800 text-sm">
                Read Case Study →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-stone-900 mb-4">
              Measurable Impact Across All Implementations
            </h2>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              SYMBI consistently delivers strong ROI while maintaining the highest 
              standards of transparency and accountability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-700 mb-2">340%</div>
              <div className="text-lg font-semibold text-stone-900 mb-1">Average ROI</div>
              <div className="text-stone-600 text-sm">Within 12 months of implementation</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-green-700 mb-2">95%</div>
              <div className="text-lg font-semibold text-stone-900 mb-1">User Adoption</div>
              <div className="text-stone-600 text-sm">Across all deployed systems</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-700 mb-2">100%</div>
              <div className="text-lg font-semibold text-stone-900 mb-1">Compliance Rate</div>
              <div className="text-stone-600 text-sm">Zero regulatory violations</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-700 mb-2">6 Mo</div>
              <div className="text-lg font-semibold text-stone-900 mb-1">Avg. Payback</div>
              <div className="text-stone-600 text-sm">Time to full return on investment</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Success Stories?
          </h2>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            See how SYMBI can transform your organization with transparent, 
            accountable AI that delivers measurable results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-amber-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-amber-700 transition-colors">
              Start Your Success Story
            </Link>
            <Link href="/risk-assessment" className="border border-stone-300 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-stone-700 transition-colors">
              Get Risk Assessment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}