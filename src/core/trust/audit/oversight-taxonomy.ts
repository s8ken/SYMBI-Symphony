/**
 * Human Oversight Taxonomy
 * 
 * Type definitions and enumerations for human oversight actions in the audit trail.
 * Supports EU AI Act and US transparency regime compliance.
 */

/**
 * Type of human oversight action
 */
export type OversightActionType =
  | 'escalation'             // Escalating an issue to human review
  | 'override'               // Human overriding system decision
  | 'approval'               // Human approving a proposed action
  | 'rejection'              // Human rejecting a proposed action
  | 'risk_reclassification'  // Reclassifying risk level
  | 'bias_review'            // Reviewing for bias concerns
  | 'rights_assessment'      // Assessing rights impacts
  | 'consent_adjustment'     // Adjusting consent boundaries
  | 'policy_update'          // Updating policy based on review

/**
 * Human oversight action details
 */
export interface OversightActionDetails {
  actionType: OversightActionType;
  target: {
    type: string;
    id: string;
    description?: string;
  };
  rationale: string;
  impact: {
    level: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedSystems?: string[];
  };
  rightsImpacted?: string[];
  attachments?: Array<{
    type: string;
    reference: string;
    description?: string;
  }>;
  reviewedBy?: {
    id: string;
    role: string;
    credentials?: string[];
  };
}
