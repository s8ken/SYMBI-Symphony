import { SymbiOrchestrator } from '../orchestrator'
import { loadOversightPolicy } from '../oversight'
import { Task } from '../types'

describe('Human oversight policy gating', () => {
  test('critical deployment requires approval and pauses task', async () => {
    const orch = new SymbiOrchestrator({ id: 'o1', port: 0, databaseUrl: 'memory://' })
    const policy = loadOversightPolicy()
    expect(policy).toBeTruthy()

    const task: Task = {
      id: 't1',
      type: 'deployment',
      status: 'pending',
      priority: 'critical',
      payload: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    } as any

    await orch.assignTask(task)
    expect(await orch.getTaskStatus('t1')).toBe('paused')
  })
})
