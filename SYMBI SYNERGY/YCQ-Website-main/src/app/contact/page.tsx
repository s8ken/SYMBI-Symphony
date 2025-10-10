"use client";

import Link from "next/link";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    useCase: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send to your backend
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isSubmitted) {
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
                  <Link href="/case-studies" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                    Case Studies
                  </Link>
                  <Link href="/risk-assessment" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                    Risk Assessment
                  </Link>
                  <Link href="/contact" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Thank You Message */}
        <section className="py-20 bg-gradient-to-b from-white to-stone-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-stone-900 mb-4">
                Thank You for Your Interest!
              </h1>
              <p className="text-lg text-stone-600 mb-8">
                We've received your message and will get back to you within 24 hours with a personalized consultation plan.
              </p>
              <div className="space-y-4">
                <p className="text-stone-600">
                  <strong>Next Steps:</strong>
                </p>
                <ul className="text-left text-stone-600 space-y-2 max-w-md mx-auto">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Initial consultation call (30 minutes)
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Custom risk assessment for your use case
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Tailored SYMBI implementation roadmap
                  </li>
                </ul>
              </div>
              <div className="mt-8">
                <Link href="/" className="bg-amber-600 text-white px-6 py-3 rounded-md font-medium hover:bg-amber-700 transition-colors">
                  Return to Homepage
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
                <Link href="/case-studies" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Case Studies
                </Link>
                <Link href="/risk-assessment" className="text-stone-700 hover:text-stone-900 px-3 py-2 text-sm font-medium">
                  Risk Assessment
                </Link>
                <Link href="/contact" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-6">
              Ready to Implement AI Responsibly?
            </h1>
            <p className="text-xl text-stone-600 max-w-3xl mx-auto">
              Get expert guidance on transparent, accountable AI implementation. 
              Our team will help you navigate risks and deploy AI solutions that build trust.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-stone-900 mb-6">
                Start Your AI Journey
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-stone-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-stone-700 mb-2">
                      Role *
                    </label>
                    <select
                      id="role"
                      name="role"
                      required
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">Select your role</option>
                      <option value="ceo">CEO/Founder</option>
                      <option value="cto">CTO/Technical Lead</option>
                      <option value="cio">CIO/IT Director</option>
                      <option value="data-science">Data Science/ML Lead</option>
                      <option value="product">Product Manager</option>
                      <option value="compliance">Compliance/Risk Officer</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="useCase" className="block text-sm font-medium text-stone-700 mb-2">
                    Primary AI Use Case *
                  </label>
                  <select
                    id="useCase"
                    name="useCase"
                    required
                    value={formData.useCase}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Select your use case</option>
                    <option value="customer-service">Customer Service Automation</option>
                    <option value="fraud-detection">Fraud Detection</option>
                    <option value="risk-assessment">Risk Assessment</option>
                    <option value="recommendation">Recommendation Systems</option>
                    <option value="predictive-analytics">Predictive Analytics</option>
                    <option value="document-processing">Document Processing</option>
                    <option value="hiring">Hiring & HR</option>
                    <option value="medical-diagnosis">Medical Diagnosis</option>
                    <option value="financial-decisions">Financial Decisions</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-2">
                    Tell us about your AI implementation goals
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Describe your current challenges, timeline, and what success looks like for your organization..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 text-white py-3 px-6 rounded-md font-medium hover:bg-amber-700 transition-colors"
                >
                  Get Your Free Consultation
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-stone-50 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-stone-900 mb-4">
                  Why Choose SYMBI?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-stone-900">Transparent by Design</div>
                      <div className="text-stone-600 text-sm">Every AI decision is explainable and auditable</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-stone-900">Risk-First Approach</div>
                      <div className="text-stone-600 text-sm">Comprehensive risk assessment and mitigation</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-stone-900">Regulatory Compliance</div>
                      <div className="text-stone-600 text-sm">Built-in compliance for GDPR, HIPAA, and more</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-stone-900">Proven Results</div>
                      <div className="text-stone-600 text-sm">Successful implementations across industries</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-stone-900 mb-4">
                  What to Expect
                </h3>
                <div className="space-y-4">
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                      1
                    </div>
                    <div>
                      <div className="font-medium text-stone-900">Discovery Call</div>
                      <div className="text-stone-600 text-sm">30-minute consultation to understand your needs</div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                      2
                    </div>
                    <div>
                      <div className="font-medium text-stone-900">Risk Assessment</div>
                      <div className="text-stone-600 text-sm">Comprehensive analysis of your AI implementation risks</div>
                    </div>
                  </div>
                  <div className="flex">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                      3
                    </div>
                    <div>
                      <div className="font-medium text-stone-900">Custom Roadmap</div>
                      <div className="text-stone-600 text-sm">Tailored implementation plan with clear milestones</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-r from-amber-50 to-stone-50 rounded-2xl">
                <div className="text-2xl font-bold text-stone-900 mb-2">Ready to Start?</div>
                <div className="text-stone-600 mb-4">Join 500+ organizations implementing AI responsibly</div>
                <Link href="/risk-assessment" className="inline-flex items-center text-amber-700 font-medium hover:text-amber-800">
                  Take our Risk Assessment →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}