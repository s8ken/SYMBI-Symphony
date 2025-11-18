import fs from 'fs'
import path from 'path'
import { Task } from './types'

type OversightAction = 'allow' | 'warn' | 'require_approval' | 'block'

interface PolicyRule { type: string; priority: string; action: OversightAction }
interface OversightPolicy { riskRules: PolicyRule[]; default: Record<string, OversightAction> }

let cachedPolicy: OversightPolicy | null = null

export function loadOversightPolicy(): OversightPolicy {
  if (cachedPolicy) return cachedPolicy
  const candidatePaths = [
    path.join(__dirname, 'oversight.policy.json'),
    path.join(process.cwd(), 'core', 'agent', 'oversight.policy.json'),
  ]
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8')
      cachedPolicy = JSON.parse(raw)
      return cachedPolicy!
    }
  }
  cachedPolicy = { riskRules: [], default: { critical: 'require_approval', high: 'warn', medium: 'allow', low: 'allow' } }
  return cachedPolicy
}

export function requiresHumanApproval(task: Task): boolean {
  const policy = loadOversightPolicy()
  const rule = policy.riskRules.find(r => r.type === task.type && r.priority === task.priority)
  if (rule) return rule.action === 'require_approval' || rule.action === 'block'
  const fallback = policy.default[task.priority]
  return fallback === 'require_approval' || fallback === 'block'
}

