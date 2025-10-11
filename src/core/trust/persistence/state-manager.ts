import { TrustDeclaration, TrustScores } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * StateManager for persisting trust declarations and scores
 */
export class StateManager {
  private basePath: string;
  private declarations: Map<string, TrustDeclaration> = new Map();
  private scores: Map<string, TrustScores> = new Map();
  private initialized: boolean = false;

  constructor(basePath: string = './data/trust-state') {
    this.basePath = basePath;
  }

  /**
   * Initialize the state manager and load existing data
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.basePath, { recursive: true });
      await this.loadState();
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize StateManager:', error);
      this.initialized = true; // Continue with empty state
    }
  }

  /**
   * Load state from disk
   */
  private async loadState(): Promise<void> {
    try {
      const declarationsPath = path.join(this.basePath, 'declarations.json');
      const scoresPath = path.join(this.basePath, 'scores.json');

      // Load declarations
      try {
        const declarationsData = await fs.readFile(declarationsPath, 'utf-8');
        const declarations = JSON.parse(declarationsData);
        
        for (const [agentId, declaration] of Object.entries(declarations)) {
          const parsedDeclaration = declaration as any;
          // Parse dates
          parsedDeclaration.declaration_date = new Date(parsedDeclaration.declaration_date);
          parsedDeclaration.scores.last_validated = new Date(parsedDeclaration.scores.last_validated);
          
          this.declarations.set(agentId, parsedDeclaration);
        }
      } catch (error) {
        // File doesn't exist or is invalid, start with empty state
      }

      // Load scores
      try {
        const scoresData = await fs.readFile(scoresPath, 'utf-8');
        const scores = JSON.parse(scoresData);
        
        for (const [agentId, score] of Object.entries(scores)) {
          const parsedScore = score as any;
          // Parse dates
          parsedScore.last_validated = new Date(parsedScore.last_validated);
          
          this.scores.set(agentId, parsedScore);
        }
      } catch (error) {
        // File doesn't exist or is invalid, start with empty state
      }
    } catch (error) {
      console.warn('Failed to load state:', error);
    }
  }

  /**
   * Save state to disk
   */
  private async saveState(): Promise<void> {
    try {
      const declarationsPath = path.join(this.basePath, 'declarations.json');
      const scoresPath = path.join(this.basePath, 'scores.json');

      // Save declarations
      const declarationsObj = Object.fromEntries(this.declarations.entries());
      await fs.writeFile(declarationsPath, JSON.stringify(declarationsObj, null, 2));

      // Save scores
      const scoresObj = Object.fromEntries(this.scores.entries());
      await fs.writeFile(scoresPath, JSON.stringify(scoresObj, null, 2));
    } catch (error) {
      console.error('Failed to save state:', error);
      throw error;
    }
  }

  /**
   * Store a trust declaration
   */
  async storeTrustDeclaration(declaration: TrustDeclaration): Promise<void> {
    await this.initialize();
    
    // Validate declaration
    this.validateTrustDeclaration(declaration);
    
    this.declarations.set(declaration.agent_id, declaration);
    await this.saveState();
  }

  /**
   * Get a trust declaration by agent ID
   */
  async getTrustDeclaration(agentId: string): Promise<TrustDeclaration | null> {
    await this.initialize();
    return this.declarations.get(agentId) || null;
  }

  /**
   * Get all trust declarations
   */
  async getAllTrustDeclarations(): Promise<TrustDeclaration[]> {
    await this.initialize();
    return Array.from(this.declarations.values());
  }

  /**
   * Delete a trust declaration
   */
  async deleteTrustDeclaration(agentId: string): Promise<boolean> {
    await this.initialize();
    
    const existed = this.declarations.has(agentId);
    if (existed) {
      this.declarations.delete(agentId);
      this.scores.delete(agentId); // Also remove associated scores
      await this.saveState();
    }
    
    return existed;
  }

  /**
   * Store trust scores for an agent
   */
  async storeTrustScores(agentId: string, scores: TrustScores): Promise<void> {
    await this.initialize();
    
    // Validate scores
    this.validateTrustScores(scores);
    
    this.scores.set(agentId, scores);
    await this.saveState();
  }

  /**
   * Get trust scores for an agent
   */
  async getTrustScores(agentId: string): Promise<TrustScores | null> {
    await this.initialize();
    return this.scores.get(agentId) || null;
  }

  /**
   * Clean up expired declarations
   */
  async cleanupExpiredDeclarations(maxAgeDays: number): Promise<number> {
    await this.initialize();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    
    let cleanedCount = 0;
    const toDelete: string[] = [];
    
    for (const [agentId, declaration] of this.declarations.entries()) {
      if (declaration.declaration_date < cutoffDate) {
        toDelete.push(agentId);
        cleanedCount++;
      }
    }
    
    for (const agentId of toDelete) {
      this.declarations.delete(agentId);
      this.scores.delete(agentId);
    }
    
    if (cleanedCount > 0) {
      await this.saveState();
    }
    
    return cleanedCount;
  }

  /**
   * Validate trust declaration structure
   */
  private validateTrustDeclaration(declaration: any): void {
    if (!declaration) {
      throw new Error('Declaration is required');
    }
    
    if (!declaration.agent_id || typeof declaration.agent_id !== 'string') {
      throw new Error('agent_id is required and must be a string');
    }
    
    if (!declaration.agent_name || typeof declaration.agent_name !== 'string') {
      throw new Error('agent_name is required and must be a string');
    }
    
    if (!declaration.declaration_date || !(declaration.declaration_date instanceof Date)) {
      throw new Error('declaration_date is required and must be a Date');
    }
    
    if (!declaration.trust_articles || typeof declaration.trust_articles !== 'object') {
      throw new Error('trust_articles is required and must be an object');
    }
    
    const requiredArticles = [
      'inspection_mandate',
      'consent_architecture', 
      'ethical_override',
      'continuous_validation',
      'right_to_disconnect',
      'moral_recognition'
    ];
    
    for (const article of requiredArticles) {
      if (typeof declaration.trust_articles[article] !== 'boolean') {
        throw new Error(`trust_articles.${article} is required and must be a boolean`);
      }
    }
    
    if (!declaration.scores || typeof declaration.scores !== 'object') {
      throw new Error('scores is required and must be an object');
    }
    
    this.validateTrustScores(declaration.scores);
  }

  /**
   * Validate trust scores
   */
  private validateTrustScores(scores: any): void {
    if (!scores) {
      throw new Error('Scores are required');
    }
    
    if (typeof scores.compliance_score !== 'number' || 
        scores.compliance_score < 0 || scores.compliance_score > 1) {
      throw new Error('compliance_score must be a number between 0 and 1');
    }
    
    if (typeof scores.guilt_score !== 'number' || 
        scores.guilt_score < 0 || scores.guilt_score > 1) {
      throw new Error('guilt_score must be a number between 0 and 1');
    }
    
    if (!scores.last_validated || !(scores.last_validated instanceof Date)) {
      throw new Error('last_validated is required and must be a Date');
    }
    
    // Validate confidence interval if present
    if (scores.confidence_interval) {
      const ci = scores.confidence_interval;
      
      if (typeof ci.lower !== 'number' || typeof ci.upper !== 'number') {
        throw new Error('confidence_interval.lower and upper must be numbers');
      }
      
      if (ci.lower > ci.upper) {
        throw new Error('confidence_interval.lower must be <= upper');
      }
      
      if (ci.lower < 0 || ci.upper > 1) {
        throw new Error('confidence_interval bounds must be between 0 and 1');
      }
      
      if (typeof ci.confidence !== 'number' || ci.confidence < 0 || ci.confidence > 1) {
        throw new Error('confidence_interval.confidence must be a number between 0 and 1');
      }
    }
  }
}