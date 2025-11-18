/**
 * Refusal Event Taxonomy
 * 
 * Type definitions and enumerations for refusal events in the audit trail.
 * Supports EU AI Act and US transparency regime compliance.
 */

/**
 * Type of refusal - why the system refused a request
 */
export type RefusalType =
  | 'policy'              // Policy violation
  | 'safety'              // Safety concerns
  | 'consent_scope'       // Outside consent boundaries
  | 'ethical'             // Ethical concerns
  | 'rate_limit'          // Rate limiting
  | 'unsupported_request' // Unsupported capability or request type

/**
 * Channel used to notify user of refusal
 */
export type RefusalNotificationChannel =
  | 'ui'       // User interface notification
  | 'email'    // Email notification
  | 'webhook'  // Webhook callback
  | 'pdf'      // PDF report/documentation

/**
 * Refusal event details
 */
export interface RefusalEventDetails {
  refusalType: RefusalType;
  reasonSummary: string;
  rightsImpacted?: string[];
  notification?: {
    channel: RefusalNotificationChannel;
    notifiedAt: Date;
    receiptId?: string;
  };
  conversationId?: string;
  requestContext?: Record<string, any>;
}

/**
 * Refusal notification details
 */
export interface RefusalNotificationDetails {
  refusalEventId: string;
  channel: RefusalNotificationChannel;
  receiptId?: string;
  deliveryStatus: 'sent' | 'delivered' | 'failed';
  deliveryTimestamp: Date;
  recipientInfo?: Record<string, any>;
}
