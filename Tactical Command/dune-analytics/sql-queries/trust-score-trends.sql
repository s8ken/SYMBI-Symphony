-- SYMBI Trust Protocol - Trust Score Trends & CIQ Metrics
-- This query analyzes trust score evolution and Clarity, Integrity, Quality metrics

WITH trust_score_history AS (
  SELECT 
    agent_id,
    agent_name,
    declaration_date,
    compliance_score,
    guilt_score,
    last_validated,
    -- Calculate trust score (inverse of guilt score)
    (1 - guilt_score) as trust_score,
    -- CIQ Metrics extraction (assuming stored in JSON format)
    (ciq_metrics->>'clarity_score')::numeric as clarity_score,
    (ciq_metrics->>'integrity_score')::numeric as integrity_score,
    (ciq_metrics->>'quality_score')::numeric as quality_score,
    -- Trust Articles for detailed analysis
    trust_articles.inspection_mandate,
    trust_articles.consent_architecture,
    trust_articles.ethical_override,
    trust_articles.continuous_validation,
    trust_articles.right_to_disconnect,
    trust_articles.moral_recognition,
    -- Audit history count
    COALESCE(array_length(audit_history, 1), 0) as audit_count
  FROM symbi_trust_declarations
  WHERE declaration_date >= CURRENT_DATE - INTERVAL '180 days'
),

agent_trust_evolution AS (
  SELECT 
    agent_id,
    agent_name,
    declaration_date,
    trust_score,
    compliance_score,
    clarity_score,
    integrity_score,
    quality_score,
    -- Calculate moving averages
    AVG(trust_score) OVER (
      PARTITION BY agent_id 
      ORDER BY declaration_date 
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as trust_score_7day_avg,
    AVG(compliance_score) OVER (
      PARTITION BY agent_id 
      ORDER BY declaration_date 
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as compliance_score_7day_avg,
    -- Calculate score changes
    trust_score - LAG(trust_score) OVER (
      PARTITION BY agent_id 
      ORDER BY declaration_date
    ) as trust_score_change,
    compliance_score - LAG(compliance_score) OVER (
      PARTITION BY agent_id 
      ORDER BY declaration_date
    ) as compliance_score_change
  FROM trust_score_history
),

daily_trust_metrics AS (
  SELECT
    DATE_TRUNC('day', declaration_date) as date,
    COUNT(*) as total_agents,
    AVG(trust_score) as avg_trust_score,
    AVG(compliance_score) as avg_compliance_score,
    AVG(clarity_score) as avg_clarity_score,
    AVG(integrity_score) as avg_integrity_score,
    AVG(quality_score) as avg_quality_score,
    -- Percentile analysis
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY trust_score) as trust_score_p25,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY trust_score) as trust_score_median,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY trust_score) as trust_score_p75,
    PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY trust_score) as trust_score_p90,
    -- Risk categories
    COUNT(CASE WHEN trust_score >= 0.8 THEN 1 END) as high_trust_agents,
    COUNT(CASE WHEN trust_score BETWEEN 0.5 AND 0.8 THEN 1 END) as medium_trust_agents,
    COUNT(CASE WHEN trust_score < 0.5 THEN 1 END) as low_trust_agents,
    -- Trust Articles compliance rates
    AVG(CASE WHEN inspection_mandate THEN 1.0 ELSE 0.0 END) * 100 as inspection_mandate_rate,
    AVG(CASE WHEN consent_architecture THEN 1.0 ELSE 0.0 END) * 100 as consent_architecture_rate,
    AVG(CASE WHEN ethical_override THEN 1.0 ELSE 0.0 END) * 100 as ethical_override_rate
  FROM trust_score_history
  GROUP BY DATE_TRUNC('day', declaration_date)
),

trust_score_distribution AS (
  SELECT
    CASE 
      WHEN trust_score >= 0.9 THEN '0.9-1.0 (Excellent)'
      WHEN trust_score >= 0.8 THEN '0.8-0.9 (Very Good)'
      WHEN trust_score >= 0.7 THEN '0.7-0.8 (Good)'
      WHEN trust_score >= 0.6 THEN '0.6-0.7 (Fair)'
      WHEN trust_score >= 0.5 THEN '0.5-0.6 (Poor)'
      ELSE '0.0-0.5 (Critical)'
    END as trust_score_range,
    COUNT(*) as agent_count,
    AVG(compliance_score) as avg_compliance_in_range,
    AVG(audit_count) as avg_audits_in_range
  FROM trust_score_history
  WHERE declaration_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY 
    CASE 
      WHEN trust_score >= 0.9 THEN '0.9-1.0 (Excellent)'
      WHEN trust_score >= 0.8 THEN '0.8-0.9 (Very Good)'
      WHEN trust_score >= 0.7 THEN '0.7-0.8 (Good)'
      WHEN trust_score >= 0.6 THEN '0.6-0.7 (Fair)'
      WHEN trust_score >= 0.5 THEN '0.5-0.6 (Poor)'
      ELSE '0.0-0.5 (Critical)'
    END
)

-- Main output combining all metrics
SELECT 
  'daily_trends' as metric_type,
  date,
  total_agents,
  ROUND(avg_trust_score, 3) as avg_trust_score,
  ROUND(avg_compliance_score, 3) as avg_compliance_score,
  ROUND(avg_clarity_score, 3) as avg_clarity_score,
  ROUND(avg_integrity_score, 3) as avg_integrity_score,
  ROUND(avg_quality_score, 3) as avg_quality_score,
  ROUND(trust_score_p25, 3) as trust_score_p25,
  ROUND(trust_score_median, 3) as trust_score_median,
  ROUND(trust_score_p75, 3) as trust_score_p75,
  ROUND(trust_score_p90, 3) as trust_score_p90,
  high_trust_agents,
  medium_trust_agents,
  low_trust_agents,
  ROUND(inspection_mandate_rate, 1) as inspection_mandate_rate,
  ROUND(consent_architecture_rate, 1) as consent_architecture_rate,
  ROUND(ethical_override_rate, 1) as ethical_override_rate,
  NULL as trust_score_range,
  NULL as agent_count,
  NULL as avg_compliance_in_range,
  NULL as avg_audits_in_range
FROM daily_trust_metrics

UNION ALL

SELECT 
  'distribution' as metric_type,
  CURRENT_DATE as date,
  NULL as total_agents,
  NULL as avg_trust_score,
  NULL as avg_compliance_score,
  NULL as avg_clarity_score,
  NULL as avg_integrity_score,
  NULL as avg_quality_score,
  NULL as trust_score_p25,
  NULL as trust_score_median,
  NULL as trust_score_p75,
  NULL as trust_score_p90,
  NULL as high_trust_agents,
  NULL as medium_trust_agents,
  NULL as low_trust_agents,
  NULL as inspection_mandate_rate,
  NULL as consent_architecture_rate,
  NULL as ethical_override_rate,
  trust_score_range,
  agent_count,
  ROUND(avg_compliance_in_range, 3) as avg_compliance_in_range,
  ROUND(avg_audits_in_range, 1) as avg_audits_in_range
FROM trust_score_distribution

ORDER BY metric_type, date DESC;