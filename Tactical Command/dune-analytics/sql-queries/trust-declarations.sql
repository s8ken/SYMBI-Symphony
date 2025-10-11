-- SYMBI Trust Protocol - Trust Declarations Analytics
-- This query analyzes trust declarations and compliance scores over time

WITH trust_declarations AS (
  SELECT 
    declaration_id,
    agent_id,
    agent_name,
    declaration_date,
    compliance_score,
    guilt_score,
    last_validated,
    -- Trust Articles breakdown
    CASE WHEN trust_articles.inspection_mandate = true THEN 1 ELSE 0 END as inspection_mandate,
    CASE WHEN trust_articles.consent_architecture = true THEN 1 ELSE 0 END as consent_architecture,
    CASE WHEN trust_articles.ethical_override = true THEN 1 ELSE 0 END as ethical_override,
    CASE WHEN trust_articles.continuous_validation = true THEN 1 ELSE 0 END as continuous_validation,
    CASE WHEN trust_articles.right_to_disconnect = true THEN 1 ELSE 0 END as right_to_disconnect,
    CASE WHEN trust_articles.moral_recognition = true THEN 1 ELSE 0 END as moral_recognition,
    -- Calculate total compliance articles
    (CASE WHEN trust_articles.inspection_mandate = true THEN 1 ELSE 0 END +
     CASE WHEN trust_articles.consent_architecture = true THEN 1 ELSE 0 END +
     CASE WHEN trust_articles.ethical_override = true THEN 1 ELSE 0 END +
     CASE WHEN trust_articles.continuous_validation = true THEN 1 ELSE 0 END +
     CASE WHEN trust_articles.right_to_disconnect = true THEN 1 ELSE 0 END +
     CASE WHEN trust_articles.moral_recognition = true THEN 1 ELSE 0 END) as total_compliant_articles
  FROM symbi_trust_declarations
  WHERE declaration_date >= CURRENT_DATE - INTERVAL '90 days'
),

compliance_metrics AS (
  SELECT
    DATE_TRUNC('day', declaration_date) as date,
    COUNT(*) as total_declarations,
    AVG(compliance_score) as avg_compliance_score,
    AVG(guilt_score) as avg_guilt_score,
    COUNT(CASE WHEN compliance_score >= 0.8 THEN 1 END) as high_compliance_count,
    COUNT(CASE WHEN compliance_score < 0.5 THEN 1 END) as low_compliance_count,
    -- Trust Articles adoption rates
    AVG(inspection_mandate::float) * 100 as inspection_mandate_rate,
    AVG(consent_architecture::float) * 100 as consent_architecture_rate,
    AVG(ethical_override::float) * 100 as ethical_override_rate,
    AVG(continuous_validation::float) * 100 as continuous_validation_rate,
    AVG(right_to_disconnect::float) * 100 as right_to_disconnect_rate,
    AVG(moral_recognition::float) * 100 as moral_recognition_rate
  FROM trust_declarations
  GROUP BY DATE_TRUNC('day', declaration_date)
)

SELECT 
  date,
  total_declarations,
  ROUND(avg_compliance_score, 3) as avg_compliance_score,
  ROUND(avg_guilt_score, 3) as avg_guilt_score,
  high_compliance_count,
  low_compliance_count,
  ROUND(high_compliance_count::float / total_declarations * 100, 1) as high_compliance_percentage,
  ROUND(inspection_mandate_rate, 1) as inspection_mandate_adoption,
  ROUND(consent_architecture_rate, 1) as consent_architecture_adoption,
  ROUND(ethical_override_rate, 1) as ethical_override_adoption,
  ROUND(continuous_validation_rate, 1) as continuous_validation_adoption,
  ROUND(right_to_disconnect_rate, 1) as right_to_disconnect_adoption,
  ROUND(moral_recognition_rate, 1) as moral_recognition_adoption
FROM compliance_metrics
ORDER BY date DESC;