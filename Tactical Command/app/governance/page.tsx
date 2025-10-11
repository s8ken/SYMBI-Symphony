"use client"

import { useState } from "react"
import { ExternalLink, TrendingUp, Users, Shield, Activity, AlertTriangle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function GovernancePage() {
  const [trustScore] = useState(94.7)
  const [lastUpdate] = useState("2025-01-06 20:00 UTC")

  // Mock data for governance metrics
  const governanceMetrics = {
    totalProposals: 127,
    activeVotes: 8,
    participationRate: 73.2,
    trustEvents: 1847
  }

  const recentProposals = [
    { id: "PROP-2025-001", title: "Trust Protocol Upgrade v2.1", status: "Active", votes: 847, timeLeft: "2d 14h" },
    { id: "PROP-2025-002", title: "Agent Certification Standards", status: "Passed", votes: 1203, timeLeft: "Completed" },
    { id: "PROP-2025-003", title: "Governance Token Distribution", status: "Active", votes: 592, timeLeft: "5d 8h" }
  ]

  const trustEvents = [
    { type: "Verification", agent: "AGT-7749", timestamp: "14:32 UTC", status: "Success" },
    { type: "Audit", protocol: "Trust-Chain", timestamp: "14:28 UTC", status: "Passed" },
    { type: "Proposal", id: "PROP-2025-001", timestamp: "14:15 UTC", status: "Vote Cast" },
    { type: "Certification", agent: "AGT-8821", timestamp: "14:02 UTC", status: "Renewed" }
  ]

  return (
    <div className="p-6 space-y-6 bg-neutral-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">GOVERNANCE CENTER</h1>
          <p className="text-neutral-400">Trust Protocol Transparency & DAO Operations</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-400 border-green-400">
            <CheckCircle className="w-3 h-3 mr-1" />
            Trust Score: {trustScore}%
          </Badge>
          <Button 
            variant="outline" 
            className="text-orange-500 border-orange-500 hover:bg-orange-500 hover:text-white"
            onClick={() => window.open('https://dune.com/symbi/trust-protocol', '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Dune
          </Button>
        </div>
      </div>

      {/* Trust Score Dashboard */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Trust Protocol Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{trustScore}%</div>
              <div className="text-sm text-neutral-400">Trust Score</div>
              <div className="text-xs text-green-400 mt-1">↑ +2.3% from last week</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-1">{governanceMetrics.totalProposals}</div>
              <div className="text-sm text-neutral-400">Total Proposals</div>
              <div className="text-xs text-blue-400 mt-1">+3 this month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-1">{governanceMetrics.participationRate}%</div>
              <div className="text-sm text-neutral-400">Participation Rate</div>
              <div className="text-xs text-purple-400 mt-1">↑ +5.1% from last month</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-1">{governanceMetrics.trustEvents}</div>
              <div className="text-sm text-neutral-400">Trust Events (24h)</div>
              <div className="text-xs text-orange-400 mt-1">Real-time monitoring</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dune Dashboard Embeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Adoption Dashboard */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Protocol Adoption
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('https://dune.com/symbi/protocol-adoption', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-neutral-800 rounded border border-neutral-600 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Dune Dashboard Embed</p>
                <p className="text-xs">Protocol adoption metrics will appear here</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-orange-500 border-orange-500"
                  onClick={() => window.open('https://dune.com/symbi/protocol-adoption', '_blank')}
                >
                  View Full Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DAO Governance Dashboard */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                DAO Governance
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.open('https://dune.com/symbi/dao-governance', '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-neutral-800 rounded border border-neutral-600 flex items-center justify-center">
              <div className="text-center text-neutral-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Dune Dashboard Embed</p>
                <p className="text-xs">DAO governance metrics will appear here</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-orange-500 border-orange-500"
                  onClick={() => window.open('https://dune.com/symbi/dao-governance', '_blank')}
                >
                  View Full Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Governance Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Proposals */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Active Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-3 bg-neutral-800 rounded border border-neutral-600">
                  <div>
                    <div className="text-sm font-medium text-white">{proposal.title}</div>
                    <div className="text-xs text-neutral-400">{proposal.id}</div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={proposal.status === "Active" ? "default" : "secondary"}
                      className={proposal.status === "Active" ? "bg-orange-500" : ""}
                    >
                      {proposal.status}
                    </Badge>
                    <div className="text-xs text-neutral-400 mt-1">{proposal.votes} votes</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trust Events Feed */}
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-white">Live Trust Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trustEvents.map((event, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-neutral-800 rounded border border-neutral-600">
                  <div className={`w-2 h-2 rounded-full ${
                    event.status === "Success" || event.status === "Passed" ? "bg-green-400" :
                    event.status === "Vote Cast" ? "bg-blue-400" : "bg-orange-400"
                  }`}></div>
                  <div className="flex-1">
                    <div className="text-sm text-white">
                      {event.type}: {event.agent || event.protocol || event.id}
                    </div>
                    <div className="text-xs text-neutral-400">{event.timestamp}</div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      event.status === "Success" || event.status === "Passed" ? "text-green-400 border-green-400" :
                      event.status === "Vote Cast" ? "text-blue-400 border-blue-400" : "text-orange-400 border-orange-400"
                    }`}
                  >
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-700">
        Last updated: {lastUpdate} | Data sourced from Dune Analytics & SYMBI Trust Protocol
      </div>
    </div>
  )
}