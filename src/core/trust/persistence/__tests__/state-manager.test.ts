import { StateManager } from '../state-manager';
import { TrustDeclaration, TrustScores } from '../../types';

describe('StateManager', () => {
  let stateManager: StateManager;
  let testDataPath: string;

  beforeEach(async () => {
    // Use a unique test directory for each test
    testDataPath = `./test-data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    stateManager = new StateManager(testDataPath);
  });

  afterEach(async () => {
    // Clean up test data after each test
    try {
      const fs = require('fs/promises');
      await fs.rm(testDataPath, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Trust Declaration Management', () => {
    const mockDeclaration: TrustDeclaration = {
      agent_id: 'test-agent-1',
      agent_name: 'Test Agent',
      declaration_date: new Date('2024-01-01'),
      trust_articles: {
        inspection_mandate: true,
        consent_architecture: true,
        ethical_override: false,
        continuous_validation: true,
        right_to_disconnect: true,
        moral_recognition: false,
      },
      scores: {
        compliance_score: 0.85,
        guilt_score: 0.15,
        last_validated: new Date('2024-01-01'),
      },
    };

    it('should store and retrieve trust declarations', async () => {
      await stateManager.storeTrustDeclaration(mockDeclaration);
      
      const retrieved = await stateManager.getTrustDeclaration('test-agent-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.agent_id).toBe('test-agent-1');
      expect(retrieved?.agent_name).toBe('Test Agent');
      expect(retrieved?.trust_articles.inspection_mandate).toBe(true);
      expect(retrieved?.scores.compliance_score).toBe(0.85);
    });

    it('should update existing trust declarations', async () => {
      await stateManager.storeTrustDeclaration(mockDeclaration);
      
      const updatedDeclaration = {
        ...mockDeclaration,
        scores: {
          compliance_score: 0.90,
          guilt_score: 0.10,
          last_validated: new Date('2024-01-02'),
        },
      };
      
      await stateManager.storeTrustDeclaration(updatedDeclaration);
      const retrieved = await stateManager.getTrustDeclaration('test-agent-1');
      
      expect(retrieved?.scores.compliance_score).toBe(0.90);
      expect(retrieved?.scores.guilt_score).toBe(0.10);
    });

    it('should return null for non-existent declarations', async () => {
      const retrieved = await stateManager.getTrustDeclaration('non-existent');
      expect(retrieved).toBeNull();
    });

    it('should list all stored declarations', async () => {
      const declaration1 = { ...mockDeclaration, agent_id: 'agent-1' };
      const declaration2 = { ...mockDeclaration, agent_id: 'agent-2' };
      
      await stateManager.storeTrustDeclaration(declaration1);
      await stateManager.storeTrustDeclaration(declaration2);
      
      const allDeclarations = await stateManager.getAllTrustDeclarations();
      
      expect(allDeclarations).toHaveLength(2);
      expect(allDeclarations.map(d => d.agent_id)).toContain('agent-1');
      expect(allDeclarations.map(d => d.agent_id)).toContain('agent-2');
    });

    it('should delete trust declarations', async () => {
      await stateManager.storeTrustDeclaration(mockDeclaration);
      
      const deleted = await stateManager.deleteTrustDeclaration('test-agent-1');
      expect(deleted).toBe(true);
      
      const retrieved = await stateManager.getTrustDeclaration('test-agent-1');
      expect(retrieved).toBeNull();
    });

    it('should return false when deleting non-existent declarations', async () => {
      const deleted = await stateManager.deleteTrustDeclaration('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('Trust Scores Management', () => {
    const mockScores: TrustScores = {
      compliance_score: 0.75,
      guilt_score: 0.25,
      confidence_interval: {
        lower: 0.70,
        upper: 0.80,
        confidence: 0.95,
      },
      last_validated: new Date('2024-01-01'),
    };

    it('should store and retrieve trust scores', async () => {
      await stateManager.storeTrustScores('test-agent-1', mockScores);
      
      const retrieved = await stateManager.getTrustScores('test-agent-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.compliance_score).toBe(0.75);
      expect(retrieved?.guilt_score).toBe(0.25);
      expect(retrieved?.confidence_interval?.lower).toBe(0.70);
    });

    it('should update existing trust scores', async () => {
      await stateManager.storeTrustScores('test-agent-1', mockScores);
      
      const updatedScores: TrustScores = {
        compliance_score: 0.80,
        guilt_score: 0.20,
        last_validated: new Date('2024-01-02'),
      };
      
      await stateManager.storeTrustScores('test-agent-1', updatedScores);
      const retrieved = await stateManager.getTrustScores('test-agent-1');
      
      expect(retrieved?.compliance_score).toBe(0.80);
      expect(retrieved?.guilt_score).toBe(0.20);
      expect(retrieved?.confidence_interval).toBeUndefined();
    });

    it('should return null for non-existent scores', async () => {
      const retrieved = await stateManager.getTrustScores('non-existent');
      expect(retrieved).toBeNull();
    });
  });

  describe('State Persistence', () => {
    it('should persist state across manager instances', async () => {
      const declaration: TrustDeclaration = {
        agent_id: 'persistent-agent',
        agent_name: 'Persistent Agent',
        declaration_date: new Date(),
        trust_articles: {
          inspection_mandate: true,
          consent_architecture: true,
          ethical_override: true,
          continuous_validation: true,
          right_to_disconnect: true,
          moral_recognition: true,
        },
        scores: {
          compliance_score: 1.0,
          guilt_score: 0.0,
          last_validated: new Date(),
        },
      };

      await stateManager.storeTrustDeclaration(declaration);
      
      // Create new manager instance
      const newStateManager = new StateManager();
      const retrieved = await newStateManager.getTrustDeclaration('persistent-agent');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.agent_id).toBe('persistent-agent');
      expect(retrieved?.scores.compliance_score).toBe(1.0);
    });

    it('should handle concurrent operations safely', async () => {
      const promises: Promise<void>[] = [];
      
      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        const declaration: TrustDeclaration = {
          agent_id: `concurrent-agent-${i}`,
          agent_name: `Concurrent Agent ${i}`,
          declaration_date: new Date(),
          trust_articles: {
            inspection_mandate: true,
            consent_architecture: true,
            ethical_override: false,
            continuous_validation: true,
            right_to_disconnect: true,
            moral_recognition: false,
          },
          scores: {
            compliance_score: 0.5 + (i * 0.05),
            guilt_score: 0.5 - (i * 0.05),
            last_validated: new Date(),
          },
        };
        
        promises.push(stateManager.storeTrustDeclaration(declaration));
      }
      
      await Promise.all(promises);
      
      const allDeclarations = await stateManager.getAllTrustDeclarations();
      expect(allDeclarations).toHaveLength(10);
      
      // Verify all agents are present
      for (let i = 0; i < 10; i++) {
        const agent = allDeclarations.find(d => d.agent_id === `concurrent-agent-${i}`);
        expect(agent).toBeDefined();
        expect(agent?.scores.compliance_score).toBe(0.5 + (i * 0.05));
      }
    });
  });

  describe('State Validation', () => {
    it('should validate trust declaration structure', async () => {
      const invalidDeclaration = {
        // Missing agent_id
        agent_name: 'Test Agent',
      } as any;

      await expect(
        stateManager.storeTrustDeclaration(invalidDeclaration)
      ).rejects.toThrow('agent_id is required and must be a string');
    });

    it('should validate trust scores ranges', async () => {
      const invalidScores: TrustScores = {
        compliance_score: 1.5, // Invalid: > 1
        guilt_score: -0.1,     // Invalid: < 0
        last_validated: new Date(),
      };

      await expect(
        stateManager.storeTrustScores('test-agent', invalidScores)
      ).rejects.toThrow('compliance_score must be a number between 0 and 1');
    });

    it('should validate confidence intervals', async () => {
      const invalidScores: TrustScores = {
        compliance_score: 0.75,
        guilt_score: 0.25,
        confidence_interval: {
          lower: 0.80,  // Invalid: lower > upper
          upper: 0.70,
          confidence: 0.95,
        },
        last_validated: new Date(),
      };

      await expect(
        stateManager.storeTrustScores('test-agent', invalidScores)
      ).rejects.toThrow('confidence_interval.lower must be <= upper');
    });
  });

  describe('State Cleanup', () => {
    it('should clean up expired declarations', async () => {
      const expiredDeclaration: TrustDeclaration = {
        agent_id: 'expired-agent',
        agent_name: 'Expired Agent',
        declaration_date: new Date('2020-01-01'), // Old date
        trust_articles: {
          inspection_mandate: true,
          consent_architecture: true,
          ethical_override: true,
          continuous_validation: true,
          right_to_disconnect: true,
          moral_recognition: true,
        },
        scores: {
          compliance_score: 0.5,
          guilt_score: 0.5,
          last_validated: new Date('2020-01-01'),
        },
      };

      await stateManager.storeTrustDeclaration(expiredDeclaration);
      
      // Clean up declarations older than 1 year
      const cleanedCount = await stateManager.cleanupExpiredDeclarations(365);
      
      expect(cleanedCount).toBe(1);
      
      const retrieved = await stateManager.getTrustDeclaration('expired-agent');
      expect(retrieved).toBeNull();
    });

    it('should preserve recent declarations during cleanup', async () => {
      const recentDeclaration: TrustDeclaration = {
        agent_id: 'recent-agent',
        agent_name: 'Recent Agent',
        declaration_date: new Date(), // Current date
        trust_articles: {
          inspection_mandate: true,
          consent_architecture: true,
          ethical_override: true,
          continuous_validation: true,
          right_to_disconnect: true,
          moral_recognition: true,
        },
        scores: {
          compliance_score: 0.8,
          guilt_score: 0.2,
          last_validated: new Date(),
        },
      };

      await stateManager.storeTrustDeclaration(recentDeclaration);
      
      const cleanedCount = await stateManager.cleanupExpiredDeclarations(365);
      
      expect(cleanedCount).toBe(0);
      
      const retrieved = await stateManager.getTrustDeclaration('recent-agent');
      expect(retrieved).toBeDefined();
    });
  });
});