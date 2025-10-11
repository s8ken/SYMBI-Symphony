-- SYMBI Trust Protocol - Comprehensive Audit Trail
-- This query provides a complete audit trail for governance and trust activities

WITH audit_events AS (
  SELECT 
    event_id,
    event_timestamp,
    block_number,
    transaction_hash,
    event_type,
    -- User/Agent identification
    COALESCE(event_data->>'agent_id', event_data->>'user_id') as actor_id,
    COALESCE(event_data->>'agent_name', event_data->>'user_name') as actor_name,
    -- Event categorization
    CASE 
      WHEN event_type IN ('trust_declaration_created', 'trust_declaration_updated', 'compliance_score_calculated') 
        THEN 'Trust Protocol'
      WHEN event_type IN ('proposal_created', 'vote_cast', 'proposal_executed', 'governance_decision') 
        THEN 'Governance'
      WHEN event_type IN ('audit_performed', 'validation_completed', 'security_check') 
        THEN 'Audit & Compliance'
      WHEN event_type IN ('constitutional_amendment', 'protocol_upgrade', 'emergency_action') 
        THEN 'Constitutional'
      ELSE 'Other'
    END as event_category,
    -- Risk assessment
    CASE 
      WHEN event_type IN ('emergency_action', 'security_breach', 'compliance_violation') THEN 'High'
      WHEN event_type IN ('constitutional_amendment', 'protocol_upgrade', 'governance_decision') THEN 'Medium'
      ELSE 'Low'
    END as risk_level,
    -- Extract key metrics
    (event_data->>'compliance_score')::numeric as compliance_score,
    (event_data->>'trust_score')::numeric as trust_score,
    (event_data->>'vote_weight')::numeric as vote_weight,
    event_data->>'proposal_id' as proposal_id,
    event_data->>'constitutional_article' as constitutional_article,
    -- Metadata
    event_data->>'notes' as notes,
    event_data->>'validator_id' as validator_id,
    event_data->>'ip_address' as ip_address,
    event_data->>'user_agent' as user_agent
  FROM symbi_audit_log
  WHERE event_timestamp >= CURRENT_DATE - INTERVAL '90 days'
),

daily_audit_summary AS (
  SELECT
    DATE_TRUNC('day', event_timestamp) as date,
    event_category,
    risk_level,
    COUNT(*) as event_count,
    COUNT(DISTINCT actor_id) as unique_actors,
    COUNT(DISTINCT proposal_id) as unique_proposals,
    AVG(compliance_score) as avg_compliance_score,
    AVG(trust_score) as avg_trust_score,
    -- Risk indicators
    COUNT(CASE WHEN risk_level = 'High' THEN 1 END) as high_risk_events,
    COUNT(CASE WHEN risk_level = 'Medium' THEN 1 END) as medium_risk_events,
    COUNT(CASE WHEN risk_level = 'Low' THEN 1 END) as low_risk_events
  FROM audit_events
  GROUP BY DATE_TRUNC('day', event_timestamp), event_category, risk_level
),

actor_activity_summary AS (
  SELECT
    actor_id,
    actor_name,
    COUNT(*) as total_events,
    COUNT(DISTINCT event_type) as unique_event_types,
    MIN(event_timestamp) as first_activity,
    MAX(event_timestamp) as last_activity,
    AVG(compliance_score) as avg_compliance_score,
    AVG(trust_score) as avg_trust_score,
    -- Activity patterns
    COUNT(CASE WHEN event_category = 'Trust Protocol' THEN 1 END) as trust_protocol_events,
    COUNT(CASE WHEN event_category = 'Governance' THEN 1 END) as governance_events,
    COUNT(CASE WHEN event_category = 'Audit & Compliance' THEN 1 END) as audit_events,
    COUNT(CASE WHEN event_category = 'Constitutional' THEN 1 END) as constitutional_events,
    -- Risk profile
    COUNT(CASE WHEN risk_level = 'High' THEN 1 END) as high_risk_actions,
    COUNT(CASE WHEN risk_level = 'Medium' THEN 1 END) as medium_risk_actions
  FROM audit_events
  WHERE actor_id IS NOT NULL
  GROUP BY actor_id, actor_name
),

compliance_violations AS (
  SELECT
    event_timestamp,
    actor_id,
    actor_name,
    event_type,
    compliance_score,
    trust_score,
    notes,
    validator_id,
    -- Severity assessment
    CASE 
      WHEN compliance_score < 0.3 THEN 'Critical'
      WHEN compliance_score < 0.5 THEN 'High'
      WHEN compliance_score < 0.7 THEN 'Medium'
      ELSE 'Low'
    END as violation_severity
  FROM audit_events
  WHERE event_type IN ('compliance_violation', 'trust_score_degradation', 'audit_failure')
    AND compliance_score IS NOT NULL
),

governance_integrity_check AS (
  SELECT
    DATE_TRUNC('hour', event_timestamp) as hour,
    COUNT(*) as total_governance_events,
    COUNT(DISTINCT actor_id) as unique_participants,
    AVG(vote_weight) as avg_vote_weight,
    COUNT(CASE WHEN event_type = 'vote_cast' THEN 1 END) as votes_cast,
    COUNT(CASE WHEN event_type = 'proposal_created' THEN 1 END) as proposals_created,
    -- Detect unusual patterns
    CASE 
      WHEN COUNT(*) > (SELECT AVG(hourly_count) * 3 FROM (
        SELECT COUNT(*) as hourly_count 
        FROM audit_events 
        WHERE event_category = 'Governance' 
        GROUP BY DATE_TRUNC('hour', event_timestamp)
      ) t) THEN 'Anomalous High Activity'
      ELSE 'Normal'
    END as activity_pattern
  FROM audit_events
  WHERE event_category = 'Governance'
  GROUP BY DATE_TRUNC('hour', event_timestamp)
)

-- Main comprehensive audit report
SELECT 
  'daily_summary' as report_type,
  date,
  event_category,
  risk_level,
  event_count,
  unique_actors,
  unique_proposals,
  ROUND(avg_compliance_score, 3) as avg_compliance_score,
  ROUND(avg_trust_score, 3) as avg_trust_score,
  high_risk_events,
  medium_risk_events,
  low_risk_events,
  NULL as actor_id,
  NULL as actor_name,
  NULL as total_events,
  NULL as first_activity,
  NULL as last_activity,
  NULL as violation_severity,
  NULL as activity_pattern
FROM daily_audit_summary

UNION ALL

SELECT 
  'actor_summary' as report_type,
  last_activity::date as date,
  'All Categories' as event_category,
  CASE 
    WHEN high_risk_actions > 0 THEN 'High'
    WHEN medium_risk_actions > 0 THEN 'Medium'
    ELSE 'Low'
  END as risk_level,
  total_events as event_count,
  1 as unique_actors,
  NULL as unique_proposals,
  ROUND(avg_compliance_score, 3) as avg_compliance_score,
  ROUND(avg_trust_score, 3) as avg_trust_score,
  high_risk_actions as high_risk_events,
  medium_risk_actions as medium_risk_events,
  (total_events - high_risk_actions - medium_risk_actions) as low_risk_events,
  actor_id,
  actor_name,
  total_events,
  first_activity,
  last_activity,
  NULL as violation_severity,
  NULL as activity_pattern
FROM actor_activity_summary
WHERE total_events >= 10  -- Focus on active participants

UNION ALL

SELECT 
  'violations' as report_type,
  event_timestamp::date as date,
  'Compliance' as event_category,
  'High' as risk_level,
  1 as event_count,
  1 as unique_actors,
  NULL as unique_proposals,
  ROUND(compliance_score, 3) as avg_compliance_score,
  ROUND(trust_score, 3) as avg_trust_score,
  1 as high_risk_events,
  0 as medium_risk_events,
  0 as low_risk_events,
  actor_id,
  actor_name,
  NULL as total_events,
  event_timestamp as first_activity,
  event_timestamp as last_activity,
  violation_severity,
  NULL as activity_pattern
FROM compliance_violations

ORDER BY report_type, date DESC, risk_level DESC;