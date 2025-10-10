/**
 * Tests for Agent Factory
 */

import { AgentFactory } from '../../src/core/agent/factory';
import { AgentType } from '../../src/core/agent/types';

describe('AgentFactory', () => {
  describe('Template Management', () => {
    it('should get repository manager template', () => {
      const template = AgentFactory.getTemplate('repository_manager');

      expect(template).toBeDefined();
      expect(template.type).toBe('repository_manager');
      expect(template.defaultCapabilities).toHaveLength(5);
      expect(template.defaultPermissions).toHaveLength(5);
    });

    it('should get all templates', () => {
      const templates = AgentFactory.getAllTemplates();

      expect(Object.keys(templates)).toHaveLength(8);
      expect(templates.repository_manager).toBeDefined();
      expect(templates.code_reviewer).toBeDefined();
    });

    it('should throw error for unknown template', () => {
      expect(() => {
        AgentFactory.getTemplate('unknown' as AgentType);
      }).toThrow('Unknown agent type');
    });
  });

  describe('Agent Creation', () => {
    it('should create agent with valid config', () => {
      const agent = AgentFactory.createAgent({
        id: 'test-agent-1',
        name: 'Test Agent',
        type: 'tester',
        apiKey: 'test-api-key',
        capabilities: [],
        permissions: [],
        metadata: {
          test_environment: 'staging'
        }
      });

      expect(agent).toBeDefined();
      expect(agent.getAgentInfo().agentId).toBeUndefined(); // Not authenticated yet
    });

    it('should validate required fields', () => {
      const validation = AgentFactory.validateConfig({
        id: '',
        name: 'Test',
        type: 'tester',
        apiKey: 'key',
        capabilities: [],
        permissions: []
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Agent ID is required');
    });

    it('should create repository manager with convenience method', () => {
      const agent = AgentFactory.createRepositoryManager({
        id: 'repo-agent-1',
        name: 'Repo Manager',
        apiKey: 'test-key',
        repositoryUrl: 'https://github.com/test/repo',
        accessToken: 'github-token'
      });

      expect(agent).toBeDefined();
    });
  });

  describe('ID and Key Generation', () => {
    it('should generate unique agent IDs', () => {
      const id1 = AgentFactory.generateAgentId('tester');
      const id2 = AgentFactory.generateAgentId('tester');

      expect(id1).not.toBe(id2);
      expect(id1).toContain('tester_');
    });

    it('should generate secure API keys', () => {
      const key1 = AgentFactory.generateApiKey();
      const key2 = AgentFactory.generateApiKey();

      expect(key1).toHaveLength(64);
      expect(key1).not.toBe(key2);
    });
  });
});
