"use client";

import Link from "next/link";
import { useState } from "react";

interface AnswerOption {
  value: string;
  label: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

interface Question {
  id: number;
  category: string;
  question: string;
  options: AnswerOption[];
}

type Answers = Record<number, AnswerOption>;

export default function RiskAssessment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      category: "Data & Privacy",
      question: "What type of data will your AI system process?",
      options: [
        { value: "personal", label: "Personal/PII data", risk: "high" },
        { value: "financial", label: "Financial data", risk: "high" },
        { value: "health", label: "Health/medical data", risk: "critical" },
        { value: "business", label: "Business/operational data", risk: "medium" },
        { value: "public", label: "Public/non-sensitive data", risk: "low" }
      ]
    },
    {
      id: 2,
      category: "Decision Impact",
      question: "What is the potential impact of AI decisions on individuals?",
      options: [
        { value: "life-safety", label: "Life or safety critical", risk: "critical" },
        { value: "financial-major", label: "Major financial impact", risk: "high" },
        { value: "legal-rights", label: "Legal rights or opportunities", risk: "high" },
        { value: "service-access", label: "Service access or quality", risk: "medium" },
        { value: "convenience", label: "Convenience or efficiency", risk: "low" }
      ]
    },
    {
      id: 3,
      category: "Regulatory Environment",
      question: "Which regulations apply to your industry?",
      options: [
        { value: "gdpr-hipaa", label: "GDPR, HIPAA, or similar", risk: "high" },
        { value: "financial-reg", label: "Financial regulations (SOX, Basel)", risk: "high" },
        { value: "government", label: "Government/public sector rules", risk: "high" },
        { value: "industry-specific", label: "Industry-specific standards", risk: "medium" },
        { value: "minimal", label: "Minimal regulatory oversight", risk: "low" }
      ]
    },
    {
      id: 4,
      category: "Transparency Requirements",
      question: "How important is explainability for your use case?",
      options: [
        { value: "legally-required", label: "Legally required to explain decisions", risk: "critical" },
        { value: "stakeholder-demand", label: "Stakeholders demand explanations", risk: "high" },
        { value: "business-value", label: "Explanations provide business value", risk: "medium" },
        { value: "nice-to-have", label: "Nice to have but not essential", risk: "low" },
        { value: "not-needed", label: "Explanations not needed", risk: "low" }
      ]
    },
    {
      id: 5,
      category: "Bias & Fairness",
      question: "What is your exposure to bias-related risks?",
      options: [
        { value: "protected-classes", label: "Decisions affect protected classes", risk: "critical" },
        { value: "hiring-lending", label: "Hiring, lending, or similar decisions", risk: "high" },
        { value: "customer-facing", label: "Customer-facing recommendations", risk: "medium" },
        { value: "internal-ops", label: "Internal operations only", risk: "low" },
        { value: "no-human-impact", label: "No direct human impact", risk: "low" }
      ]
    }
  ];

  const handleAnswer = (questionId: number, answer: AnswerOption) => {
    setAnswers({ ...answers, [questionId]: answer });
    if (questionId < questions.length) {
      setCurrentStep(questionId + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateRisk = () => {
    const riskScores = { low: 1, medium: 2, high: 3, critical: 4 };
    const totalScore = Object.values(answers).reduce((sum: number, answer: AnswerOption) => {
      return sum + riskScores[answer.risk];
    }, 0);
    const maxScore = questions.length * 4;
    const riskPercentage = (totalScore / maxScore) * 100;
    
    if (riskPercentage >= 75) return { level: "Critical", color: "red", description: "High-risk implementation requiring comprehensive oversight" };
    if (riskPercentage >= 50) return { level: "High", color: "orange", description: "Significant risks requiring careful management" };
    if (riskPercentage >= 25) return { level: "Medium", color: "yellow", description: "Moderate risks with standard mitigation measures" };
    return { level: "Low", color: "green", description: "Lower risk implementation with basic safeguards" };
  };

  const resetAssessment = () => {
    setCurrentStep(1);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    const risk = calculateRisk();
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
                  <Link href="/risk-assessment" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
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

        {/* Results */}
        <section className="py-20 bg-gradient-to-b from-white to-stone-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-stone-900 mb-4">
                Your AI Risk Assessment Results
              </h1>
              <p className="text-xl text-stone-600">
                Based on your responses, here's your personalized risk profile and recommendations.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold mb-4 ${
                  risk.color === 'red' ? 'bg-red-100 text-red-800' :
                  risk.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                  risk.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {risk.level} Risk Level
                </div>
                <p className="text-lg text-stone-600">{risk.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-4">Key Risk Areas</h3>
                  <div className="space-y-3">
                    {questions.map((q, index) => {
                      const answer = answers[q.id];
                      return (
                        <div key={q.id} className="flex justify-between items-center">
                          <span className="text-stone-600">{q.category}</span>
                          <span className={`px-2 py-1 rounded text-sm font-medium ${
                            answer.risk === 'critical' ? 'bg-red-100 text-red-800' :
                            answer.risk === 'high' ? 'bg-orange-100 text-orange-800' :
                            answer.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {answer.risk.charAt(0).toUpperCase() + answer.risk.slice(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-stone-900 mb-4">SYMBI Solutions</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-stone-600">Explainable AI for all decisions</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-stone-600">Continuous bias monitoring</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-stone-600">Complete audit trails</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-stone-600">Regulatory compliance built-in</span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <span className="text-stone-600">Data sovereignty protection</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="bg-amber-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-amber-700 transition-colors">
                  Get Personalized Consultation
                </Link>
                <button 
                  onClick={resetAssessment}
                  className="border border-stone-300 text-stone-700 px-8 py-3 rounded-md text-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Retake Assessment
                </button>
              </div>
              <p className="text-sm text-stone-500">
                This assessment provides general guidance. Contact us for a detailed analysis of your specific use case.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const currentQuestion = questions[currentStep - 1];
  const progress = (currentStep / questions.length) * 100;

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
                <Link href="/risk-assessment" className="text-stone-900 border-b-2 border-amber-600 px-3 py-2 text-sm font-medium">
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

      {/* Assessment */}
      <section className="py-20 bg-gradient-to-b from-white to-stone-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-stone-900 mb-4">
              AI Risk Assessment
            </h1>
            <p className="text-xl text-stone-600 mb-8">
              Evaluate your AI implementation risks and get personalized recommendations 
              for transparent, accountable AI solutions.
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-stone-200 rounded-full h-2 mb-8">
              <div 
                className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="text-sm text-stone-500">
              Question {currentStep} of {questions.length}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="text-sm font-medium text-amber-700 mb-2">
                {currentQuestion.category}
              </div>
              <h2 className="text-2xl font-semibold text-stone-900">
                {currentQuestion.question}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                  className="w-full text-left p-4 border border-stone-200 rounded-lg hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-stone-900">{option.label}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      option.risk === 'critical' ? 'bg-red-100 text-red-800' :
                      option.risk === 'high' ? 'bg-orange-100 text-orange-800' :
                      option.risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {option.risk.charAt(0).toUpperCase() + option.risk.slice(1)} Risk
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {currentStep > 1 && (
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="text-stone-600 hover:text-stone-900 font-medium"
                >
                  ← Previous Question
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}