/**
 * SYMBI Trust Manager
 * 
 * Manages cryptographic trust receipts, verification, and compliance scoring.
 * Implements the 6 trust principles of SYMBI protocol.
 */

import crypto from 'crypto';
import { EventEmitter } from 'events';
import { 
  TrustReceipt, 
  TrustVerification, 
  TrustScore, 
  ComplianceCheck 
} from '../shared/types/src';

export interface TrustReceiptData {
  operation: string;
  agentId?: string;
  userId?: string;
  request?: any;
  response?: any;
  timestamp: string;
  metadata?: Record<string, any>;
}

export class TrustManager extends EventEmitter {
  private receipts: Map<string, TrustReceipt> = new Map();
  private privateKeys: Map<string, string> = new Map();
  private publicKeys: Map<string, string> = new Map();

  constructor() {
    super();
    this.setupEventHandlers();
    this.initializeKeyPair();
  }

  private setupEventHandlers(): void {
    this.on('receipt:created', (receipt: TrustReceipt) => {
      console.log(`Trust receipt created: ${receipt.id}`);
    });

    this.on('receipt:verified', (verification: TrustVerification) => {
      console.log(`Trust receipt verified: ${verification.receiptId} - ${verification.valid ? 'VALID' : 'INVALID'}`);
    });
  }

  /**
   * Create a cryptographic trust receipt
   */
  public async createReceipt(data: TrustReceiptData): Promise<TrustReceipt> {
    const receiptId = this.generateReceiptId();
    const timestamp = new Date().toISOString();
    
    // Create content hash
    const content = {
      receiptId,
      timestamp,
      operation: data.operation,
      agentId: data.agentId,
      userId: data.userId,
      request: data.request,
      response: data.response,
      metadata: data.metadata
    };

    const contentHash = this.createContentHash(content);
    
    // Create digital signature
    const signature = this.createSignature(contentHash);
    
    // Calculate trust score based on 6 principles
    const trustScore = this.calculateTrustScore(data);
    
    // Check compliance
    const compliance = await this.checkCompliance(data);
    
    const receipt: TrustReceipt = {
      id: receiptId,
      timestamp,
      operation: data.operation,
      agentId: data.agentId,
      userId: data.userId,
      content,
      contentHash,
      signature,
      trustScore,
      compliance,
      verified: true
    };

    this.receipts.set(receiptId, receipt);
    this.emit('receipt:created', receipt);
    
    return receipt;
  }

  /**
   * Get a trust receipt by ID
   */
  public async getReceipt(receiptId: string): Promise<TrustReceipt | null> {
    return this.receipts.get(receiptId) || null;
  }

  /**
   * Verify a trust receipt
   */
  public async verifyReceipt(receiptId: string, signature?: string): Promise<TrustVerification> {
    const receipt = this.receipts.get(receiptId);
    
    if (!receipt) {
      return {
        receiptId,
        valid: false,
        reason: 'Receipt not found',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // Verify content hash
      const expectedHash = this.createContentHash(receipt.content);
      if (expectedHash !== receipt.contentHash) {
        return {
          receiptId,
          valid: false,
          reason: 'Content hash mismatch - receipt has been tampered with',
          timestamp: new Date().toISOString()
        };
      }

      // Verify digital signature
      const signatureToVerify = signature || receipt.signature;
      const signatureValid = this.verifySignature(receipt.contentHash, signatureToVerify);
      
      if (!signatureValid) {
        return {
          receiptId,
          valid: false,
          reason: 'Invalid digital signature',
          timestamp: new Date().toISOString()
        };
      }

      // Additional compliance checks
      const complianceCheck = await this.verifyCompliance(receipt);
      
      return {
        receiptId,
        valid: true,
        signatureValid: true,
        hashValid: true,
        complianceCheck,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        receiptId,
        valid: false,
        reason: `Verification error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get trust manager status
   */
  public getStatus(): any {
    return {
      totalReceipts: this.receipts.size,
      keysManaged: this.privateKeys.size,
      averageTrustScore: this.calculateAverageTrustScore()
    };
  }

  /**
   * List receipts by criteria
   */
  public async listReceipts(criteria: {
    agentId?: string;
    userId?: string;
    operation?: string;
    dateRange?: { start: Date; end: Date };
  }): Promise<TrustReceipt[]> {
    const receipts = Array.from(this.receipts.values());
    
    return receipts.filter(receipt => {
      if (criteria.agentId && receipt.agentId !== criteria.agentId) {
        return false;
      }
      if (criteria.userId && receipt.userId !== criteria.userId) {
        return false;
      }
      if (criteria.operation && receipt.operation !== criteria.operation) {
        return false;
      }
      if (criteria.dateRange) {
        const receiptDate = new Date(receipt.timestamp);
        if (receiptDate < criteria.dateRange.start || receiptDate > criteria.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Calculate trust score based on 6 SYMBI principles
   */
  private calculateTrustScore(data: TrustReceiptData): TrustScore {
    const weights = {
      consent: 0.25,      // 25% - CRITICAL
      inspection: 0.20,   // 20% - HIGH
      validation: 0.20,   // 20% - HIGH
      override: 0.15,     // 15% - CRITICAL
      disconnect: 0.10,   // 10% - MEDIUM
      recognition: 0.10   // 10% - MEDIUM
    };

    // Individual principle scores (0-1)
    const scores = {
      consent: this.checkConsentCompliance(data),
      inspection: this.checkInspectionCompliance(data),
      validation: this.checkValidationCompliance(data),
      override: this.checkOverrideCompliance(data),
      disconnect: this.checkDisconnectCompliance(data),
      recognition: this.checkRecognitionCompliance(data)
    };

    // Calculate weighted score
    let totalScore = 0;
    for (const [principle, weight] of Object.entries(weights)) {
      totalScore += scores[principle] * weight;
    }

    // Apply critical violation penalties
    if (scores.consent === 0 || scores.override === 0) {
      totalScore -= 0.1; // -10% penalty for critical violations
    }

    return {
      overall: Math.max(0, Math.min(1, totalScore)),
      principles: scores,
      level: this.getTrustLevel(totalScore),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check compliance with regulations and policies
   */
  private async checkCompliance(data: TrustReceiptData): Promise<ComplianceCheck> {
    const checks = {
      gdpr: this.checkGDPRCompliance(data),
      euAIAct: this.checkEUAIActCompliance(data),
      ccpa: this.checkCCPACompliance(data),
      iso27001: this.checkISO27001Compliance(data)
    };

    const overallScore = Object.values(checks).reduce((sum, check) => sum + check.score, 0) / Object.keys(checks).length;

    return {
      overall: overallScore,
      regulations: checks,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify compliance of an existing receipt
   */
  private async verifyCompliance(receipt: TrustReceipt): Promise<ComplianceCheck> {
    // Re-check compliance with current regulations
    return this.checkCompliance({
      operation: receipt.operation,
      agentId: receipt.agentId,
      userId: receipt.userId,
      request: receipt.content.request,
      response: receipt.content.response,
      timestamp: receipt.timestamp
    });
  }

  // Individual principle compliance checks
  private checkConsentCompliance(data: TrustReceiptData): number {
    // Check if user consent was obtained and documented
    if (data.metadata?.consentVerified) {
      return 1.0;
    }
    if (data.request?.consent || data.metadata?.impliedConsent) {
      return 0.7;
    }
    return 0.0;
  }

  private checkInspectionCompliance(data: TrustReceiptData): number {
    // Check if decision process is transparent and inspectable
    if (data.metadata?.auditTrail && data.metadata?.explanation) {
      return 1.0;
    }
    if (data.response?.explanation || data.metadata?.decisionFactors) {
      return 0.8;
    }
    return 0.5;
  }

  private checkValidationCompliance(data: TrustReceiptData): number {
    // Check if AI behavior is continuously validated
    if (data.metadata?.validationResults && data.metadata?.monitoringActive) {
      return 1.0;
    }
    if (data.metadata?.validationResults) {
      return 0.8;
    }
    return 0.6;
  }

  private checkOverrideCompliance(data: TrustReceiptData): number {
    // Check if human oversight is available
    if (data.metadata?.humanOversight === true) {
      return 1.0;
    }
    if (data.metadata?.overrideAvailable || data.request?.humanInLoop) {
      return 0.8;
    }
    return 0.4;
  }

  private checkDisconnectCompliance(data: TrustReceiptData): number {
    // Check if user can disconnect/opt-out
    if (data.metadata?.disconnectAvailable || data.request?.optOutOption) {
      return 1.0;
    }
    return 0.7; // Default score - most systems have some form of opt-out
  }

  private checkRecognitionCompliance(data: TrustReceiptData): number {
    // Check if AI acknowledges limitations
    if (data.response?.confidence || data.metadata?.acknowledgedLimitations) {
      return 1.0;
    }
    return 0.6;
  }

  // Regulation compliance checks
  private checkGDPRCompliance(data: TrustReceiptData): { score: number; details: string[] } {
    const details: string[] = [];
    let score = 0;

    if (data.metadata?.consentVerified) {
      score += 0.3;
      details.push('User consent verified');
    }

    if (data.metadata?.dataMinimization) {
      score += 0.3;
      details.push('Data minimization applied');
    }

    if (data.metadata?.rightToAccess) {
      score += 0.2;
      details.push('Right to access supported');
    }

    if (data.metadata?.rightToErasure) {
      score += 0.2;
      details.push('Right to erasure supported');
    }

    return { score, details };
  }

  private checkEUAIActCompliance(data: TrustReceiptData): { score: number; details: string[] } {
    const details: string[] = [];
    let score = 0;

    if (data.metadata?.transparency) {
      score += 0.4;
      details.push('Transparency requirements met');
    }

    if (data.metadata?.humanOversight) {
      score += 0.3;
      details.push('Human oversight implemented');
    }

    if (data.metadata?.technicalDocumentation) {
      score += 0.3;
      details.push('Technical documentation available');
    }

    return { score, details };
  }

  private checkCCPACompliance(data: TrustReceiptData): { score: number; details: string[] } {
    const details: string[] = [];
    let score = 0;

    if (data.metadata?.rightToKnow) {
      score += 0.5;
      details.push('Right to know implemented');
    }

    if (data.metadata?.rightToDelete) {
      score += 0.5;
      details.push('Right to delete implemented');
    }

    return { score, details };
  }

  private checkISO27001Compliance(data: TrustReceiptData): { score: number; details: string[] } {
    const details: string[] = [];
    let score = 0;

    if (data.metadata?.securityControls) {
      score += 0.5;
      details.push('Security controls implemented');
    }

    if (data.metadata?.riskAssessment) {
      score += 0.5;
      details.push('Risk assessment conducted');
    }

    return { score, details };
  }

  private getTrustLevel(score: number): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    if (score >= 0.90) return 'excellent';
    if (score >= 0.70) return 'good';
    if (score >= 0.50) return 'needs_attention';
    return 'critical';
  }

  private calculateAverageTrustScore(): number {
    const receipts = Array.from(this.receipts.values());
    if (receipts.length === 0) return 0;

    const totalScore = receipts.reduce((sum, receipt) => sum + receipt.trustScore.overall, 0);
    return totalScore / receipts.length;
  }

  // Cryptographic operations
  private initializeKeyPair(): void {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });

    this.publicKeys.set('default', publicKey);
    this.privateKeys.set('default', privateKey);
  }

  private createContentHash(content: any): string {
    const contentString = JSON.stringify(content, Object.keys(content).sort());
    return crypto.createHash('sha256').update(contentString).digest('hex');
  }

  private createSignature(contentHash: string): string {
    const privateKey = this.privateKeys.get('default');
    if (!privateKey) {
      throw new Error('No private key available');
    }

    return crypto.sign('sha256', Buffer.from(contentHash), privateKey).toString('base64');
  }

  private verifySignature(contentHash: string, signature: string): boolean {
    const publicKey = this.publicKeys.get('default');
    if (!publicKey) {
      throw new Error('No public key available');
    }

    try {
      return crypto.verify('sha256', Buffer.from(contentHash), publicKey, Buffer.from(signature, 'base64'));
    } catch {
      return false;
    }
  }

  private generateReceiptId(): string {
    return `tr_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
}