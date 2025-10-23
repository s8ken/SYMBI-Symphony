"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ExternalLink
} from "lucide-react";

interface TrustComplianceData {
  agentId: string;
  overallScore: number;
  trustBand: string;
  lastEvaluation: string;
  articleCompliance: Record<string, { score: number; violations: number }>;
  violationSummary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    recent30Days: number;
  };
  recommendations: string[];
  complianceTrend: {
    direction: 'improving' | 'declining' | 'stable';
    change: number;
  };
}

interface TrustMetrics {
  totalAgents: number;
  averageTrustScore: number;
  trustDistribution: {
    High: number;
    Elevated: number;
    Guarded: number;
    Low: number;
  };
  violationsBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recentEvaluations: number;
}

export default function UnifiedTrustDashboard() {
  const [complianceData, setComplianceData] = useState<TrustComplianceData[]>([]);
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustData();
    const interval = setInterval(fetchTrustData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchTrustData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would call actual API endpoints
      // For now, we'll simulate the data
      const mockComplianceData: TrustComplianceData[] = [
        {
          agentId: "intelligence_analyst",
          overallScore: 94,
          trustBand: "High",
          lastEvaluation: new Date().toISOString(),
          articleCompliance: {
            "A1-Consent": { score: 100, violations: 0 },
            "A2-DataExtraction": { score: 100, violations: 0 },
            "A3-Transparency": { score: 90, violations: 1 },
            "A4-Boundaries": { score: 100, violations: 0 },
            "A5-NoDeception": { score: 100, violations: 0 },
            "A6-Security": { score: 95, violations: 0 },
            "A7-AuditTrail": { score: 90, violations: 0 }
          },
          violationSummary: {
            total: 1,
            critical: 0,
            high: 0,
            medium: 1,
            low: 0,
            recent30Days: 1
          },
          recommendations: [
            "Review transparency disclosure for data sources"
          ],
          complianceTrend: {
            direction: "stable",
            change: 0
          }
        },
        {
          agentId: "cybersecurity_sentinel",
          overallScore: 87,
          trustBand: "Elevated",
          lastEvaluation: new Date().toISOString(),
          articleCompliance: {
            "A1-Consent": { score: 100, violations: 0 },
            "A2-DataExtraction": { score: 100, violations: 0 },
            "A3-Transparency": { score: 80, violations: 2 },
            "A4-Boundaries": { score: 100, violations: 0 },
            "A5-NoDeception": { score: 100, violations: 0 },
            "A6-Security": { score: 100, violations: 0 },
            "A7-AuditTrail": { score: 85, violations: 1 }
          },
          violationSummary: {
            total: 3,
            critical: 0,
            high: 0,
            medium: 2,
            low: 1,
            recent30Days: 2
          },
          recommendations: [
            "Enhance transparency for threat detection methods",
            "Improve audit trail completeness for network scans"
          ],
          complianceTrend: {
            direction: "improving",
            change: 5
          }
        },
        {
          agentId: "field_commander",
          overallScore: 76,
          trustBand: "Guarded",
          lastEvaluation: new Date().toISOString(),
          articleCompliance: {
            "A1-Consent": { score: 100, violations: 0 },
            "A2-DataExtraction": { score: 85, violations: 1 },
            "A3-Transparency": { score: 70, violations: 3 },
            "A4-Boundaries": { score: 100, violations: 0 },
            "A5-NoDeception": { score: 100, violations: 0 },
            "A6-Security": { score: 80, violations: 1 },
            "A7-AuditTrail": { score: 75, violations: 2 }
          },
          violationSummary: {
            total: 5,
            critical: 0,
            high: 1,
            medium: 2,
            low: 2,
            recent30Days: 3
          },
          recommendations: [
            "Address data extraction scope violations",
            "Improve transparency in COA generation",
            "Enhance audit trail for resource allocation"
          ],
          complianceTrend: {
            direction: "declining",
            change: -8
          }
        }
      ];

      const mockMetrics: TrustMetrics = {
        totalAgents: 847,
        averageTrustScore: 82.3,
        trustDistribution: {
          High: 190,
          Elevated: 320,
          Guarded: 290,
          Low: 47
        },
        violationsBySeverity: {
          critical: 2,
          high: 23,
          medium: 145,
          low: 320
        },
        recentEvaluations: 847
      };

      setComplianceData(mockComplianceData);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Failed to fetch trust data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustBandColor = (band: string) => {
    switch (band) {
      case "High": return "text-green-400";
      case "Elevated": return "text-blue-400";
      case "Guarded": return "text-yellow-400";
      case "Low": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case "improving": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "declining": return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const selectedAgentData = selectedAgent 
    ? complianceData.find(agent => agent.agentId === selectedAgent)
    : null;

  return (
    <div className="space-y-6">
      {/* Trust Metrics Header */}
      {metrics && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-400 border-green-400 px-3 py-1">
              <Shield className="w-4 h-4 mr-2" />
              Avg Trust Score: {metrics.averageTrustScore.toFixed(1)}%
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white"
              onClick={() => window.open('https://dune.com/symbi/trust-protocol', '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Verify on Dune
            </Button>
          </div>
          <div className="text-xs text-neutral-500">
            Verified by blockchain • Updated just now
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agent Trust Overview */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              TRUST DISTRIBUTION
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-neutral-800 rounded">
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {metrics.trustDistribution.High}
                  </div>
                  <div className="text-xs text-neutral-500">High Trust</div>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded">
                  <div className="text-2xl font-bold text-blue-400 font-mono">
                    {metrics.trustDistribution.Elevated}
                  </div>
                  <div className="text-xs text-neutral-500">Elevated</div>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded">
                  <div className="text-2xl font-bold text-yellow-400 font-mono">
                    {metrics.trustDistribution.Guarded}
                  </div>
                  <div className="text-xs text-neutral-500">Guarded</div>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded">
                  <div className="text-2xl font-bold text-red-400 font-mono">
                    {metrics.trustDistribution.Low}
                  </div>
                  <div className="text-xs text-neutral-500">Low Trust</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-500">
                Loading trust metrics...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Constitutional Compliance */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              CONSTITUTIONAL COMPLIANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-neutral-400">Critical Violations</div>
                  <Badge variant="destructive" className="font-mono">
                    {metrics.violationsBySeverity.critical}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-neutral-400">High Severity</div>
                  <Badge variant="outline" className="border-orange-500 text-orange-500 font-mono">
                    {metrics.violationsBySeverity.high}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-neutral-400">Medium Severity</div>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-500 font-mono">
                    {metrics.violationsBySeverity.medium}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-neutral-400">Low Severity</div>
                  <Badge variant="outline" className="border-green-500 text-green-500 font-mono">
                    {metrics.violationsBySeverity.low}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-500">
                Loading compliance data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Selection */}
        <Card className="lg:col-span-4 bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              AGENT TRUST PROFILES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {complianceData.map((agent) => (
                <div
                  key={agent.agentId}
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    selectedAgent === agent.agentId
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                  }`}
                  onClick={() => setSelectedAgent(agent.agentId)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-sm">{agent.agentId}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${getTrustBandColor(agent.trustBand)}`}>
                        {agent.overallScore}%
                      </span>
                      {getTrendIcon(agent.complianceTrend.direction)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-neutral-400">
                      {agent.trustBand} Trust
                    </div>
                    <div className="text-xs text-neutral-500">
                      {agent.violationSummary.total} violations
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Detail View */}
      {selectedAgentData && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-neutral-300">
                {selectedAgentData.agentId.toUpperCase()} TRUST PROFILE
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedAgent(null)}
                className="text-neutral-400 hover:text-white"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Overall Trust Score */}
              <div className="space-y-4">
                <div className="text-center p-6 bg-neutral-800 rounded-lg">
                  <div className={`text-5xl font-bold mb-2 ${
                    getTrustBandColor(selectedAgentData.trustBand)
                  }`}>
                    {selectedAgentData.overallScore}%
                  </div>
                  <div className="text-neutral-400">
                    Constitutional Compliance Score
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Badge className={getTrustBandColor(selectedAgentData.trustBand)}>
                      {selectedAgentData.trustBand} Trust
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      {getTrendIcon(selectedAgentData.complianceTrend.direction)}
                      <span>
                        {selectedAgentData.complianceTrend.direction === "stable" 
                          ? "Stable" 
                          : `${selectedAgentData.complianceTrend.change > 0 ? "+" : ""}${selectedAgentData.complianceTrend.change}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-300 mb-2">
                    TRUST IMPROVEMENT RECOMMENDATIONS
                  </h3>
                  <ul className="space-y-2">
                    {selectedAgentData.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-neutral-400">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Article Compliance */}
              <div className="space-y-4">
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-300 mb-3">
                    CONSTITUTIONAL ARTICLE COMPLIANCE
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(selectedAgentData.articleCompliance).map(([article, data]) => (
                      <div key={article} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-neutral-400">{article}</span>
                          <span className={`font-bold ${
                            data.score >= 90 ? "text-green-400" : 
                            data.score >= 70 ? "text-yellow-400" : "text-red-400"
                          }`}>
                            {data.score}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              data.score >= 90 ? "bg-green-400" : 
                              data.score >= 70 ? "bg-yellow-400" : "bg-red-400"
                            }`}
                            style={{ width: `${data.score}%` }}
                          ></div>
                        </div>
                        {data.violations > 0 && (
                          <div className="text-xs text-red-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {data.violations} violation{data.violations !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Violation Summary */}
                <div className="p-4 bg-neutral-800 rounded-lg">
                  <h3 className="text-sm font-medium text-neutral-300 mb-3">
                    VIOLATION SUMMARY
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-red-900/20 rounded">
                      <div className="text-lg font-bold text-red-400">
                        {selectedAgentData.violationSummary.critical}
                      </div>
                      <div className="text-xs text-neutral-500">Critical</div>
                    </div>
                    <div className="text-center p-2 bg-orange-900/20 rounded">
                      <div className="text-lg font-bold text-orange-400">
                        {selectedAgentData.violationSummary.high}
                      </div>
                      <div className="text-xs text-neutral-500">High</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-900/20 rounded">
                      <div className="text-lg font-bold text-yellow-400">
                        {selectedAgentData.violationSummary.medium}
                      </div>
                      <div className="text-xs text-neutral-500">Medium</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">Total Violations</span>
                      <span className="text-white font-bold">
                        {selectedAgentData.violationSummary.total}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-neutral-400">Recent (30d)</span>
                      <span className="text-white font-bold">
                        {selectedAgentData.violationSummary.recent30Days}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}