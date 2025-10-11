-- Dune Analytics SQL Queries for SYMBI Trust Protocol
-- These queries analyze governance events and trust protocol metrics

-- 1. Governance Proposal Activity Dashboard
-- Query: governance_proposal_activity
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(*) as total_proposals,
    COUNT(CASE WHEN event_data->>'status' = 'ACTIVE' THEN 1 END) as active_proposals,
    COUNT(CASE WHEN event_data->>'status' = 'EXECUTED' THEN 1 END) as executed_proposals,
    COUNT(CASE WHEN event_data->>'status' = 'REJECTED' THEN 1 END) as rejected_proposals
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_PROPOSAL_CREATED'
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', block_time)
ORDER BY date DESC;

-- 2. Trust Score Distribution Analysis
-- Query: trust_score_distribution
SELECT 
    CASE 
        WHEN CAST(event_data->>'trust_score' AS DECIMAL) >= 0.9 THEN 'Excellent (0.9-1.0)'
        WHEN CAST(event_data->>'trust_score' AS DECIMAL) >= 0.7 THEN 'Good (0.7-0.89)'
        WHEN CAST(event_data->>'trust_score' AS DECIMAL) >= 0.5 THEN 'Fair (0.5-0.69)'
        ELSE 'Poor (0-0.49)'
    END as trust_level,
    COUNT(*) as agent_count,
    AVG(CAST(event_data->>'trust_score' AS DECIMAL)) as avg_score
FROM symbi_trust_events 
WHERE event_type = 'TRUST_SCORE_UPDATED'
    AND block_time >= NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY avg_score DESC;

-- 3. Voting Participation Metrics
-- Query: voting_participation
SELECT 
    event_data->>'proposal_id' as proposal_id,
    event_data->>'proposal_title' as title,
    COUNT(*) as total_votes,
    COUNT(CASE WHEN event_data->>'vote' = 'FOR' THEN 1 END) as votes_for,
    COUNT(CASE WHEN event_data->>'vote' = 'AGAINST' THEN 1 END) as votes_against,
    COUNT(CASE WHEN event_data->>'vote' = 'ABSTAIN' THEN 1 END) as abstentions,
    ROUND(
        COUNT(CASE WHEN event_data->>'vote' = 'FOR' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as approval_rate
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_VOTE_CAST'
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
HAVING COUNT(*) >= 10  -- Only proposals with significant participation
ORDER BY total_votes DESC;

-- 4. Trust Declaration Trends
-- Query: trust_declaration_trends
SELECT 
    DATE_TRUNC('hour', block_time) as hour,
    COUNT(*) as declarations_count,
    COUNT(DISTINCT event_data->>'declarant_id') as unique_declarants,
    COUNT(DISTINCT event_data->>'target_id') as unique_targets,
    AVG(CAST(event_data->>'confidence_score' AS DECIMAL)) as avg_confidence
FROM symbi_trust_events 
WHERE event_type = 'TRUST_DECLARATION_PUBLISHED'
    AND block_time >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', block_time)
ORDER BY hour DESC;

-- 5. Governance Event Volume by Type
-- Query: governance_event_volume
SELECT 
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT event_data->>'actor_id') as unique_actors,
    MIN(block_time) as first_event,
    MAX(block_time) as latest_event
FROM symbi_governance_events 
WHERE block_time >= NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC;

-- 6. CIQ Metrics Performance Dashboard
-- Query: ciq_metrics_performance
SELECT 
    DATE_TRUNC('day', block_time) as date,
    AVG(CAST(event_data->>'coherence_score' AS DECIMAL)) as avg_coherence,
    AVG(CAST(event_data->>'intelligence_score' AS DECIMAL)) as avg_intelligence,
    AVG(CAST(event_data->>'quality_score' AS DECIMAL)) as avg_quality,
    AVG(CAST(event_data->>'composite_score' AS DECIMAL)) as avg_composite,
    COUNT(*) as measurement_count
FROM symbi_trust_events 
WHERE event_type = 'CIQ_METRICS_CALCULATED'
    AND block_time >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', block_time)
ORDER BY date DESC;

-- 7. Agent Activity and Trust Correlation
-- Query: agent_trust_correlation
WITH agent_activity AS (
    SELECT 
        event_data->>'agent_id' as agent_id,
        COUNT(*) as total_events,
        COUNT(DISTINCT DATE_TRUNC('day', block_time)) as active_days
    FROM symbi_governance_events 
    WHERE block_time >= NOW() - INTERVAL '30 days'
    GROUP BY 1
),
agent_trust AS (
    SELECT 
        event_data->>'agent_id' as agent_id,
        AVG(CAST(event_data->>'trust_score' AS DECIMAL)) as avg_trust_score,
        MAX(CAST(event_data->>'trust_score' AS DECIMAL)) as max_trust_score
    FROM symbi_trust_events 
    WHERE event_type = 'TRUST_SCORE_UPDATED'
        AND block_time >= NOW() - INTERVAL '30 days'
    GROUP BY 1
)
SELECT 
    a.agent_id,
    a.total_events,
    a.active_days,
    COALESCE(t.avg_trust_score, 0) as avg_trust_score,
    COALESCE(t.max_trust_score, 0) as max_trust_score,
    CASE 
        WHEN a.total_events > 100 AND t.avg_trust_score > 0.8 THEN 'High Activity, High Trust'
        WHEN a.total_events > 100 AND t.avg_trust_score <= 0.8 THEN 'High Activity, Low Trust'
        WHEN a.total_events <= 100 AND t.avg_trust_score > 0.8 THEN 'Low Activity, High Trust'
        ELSE 'Low Activity, Low Trust'
    END as activity_trust_category
FROM agent_activity a
LEFT JOIN agent_trust t ON a.agent_id = t.agent_id
ORDER BY a.total_events DESC;

-- 8. Anomaly Detection Summary
-- Query: anomaly_detection_summary
SELECT 
    DATE_TRUNC('day', block_time) as date,
    event_data->>'anomaly_type' as anomaly_type,
    COUNT(*) as anomaly_count,
    AVG(CAST(event_data->>'severity_score' AS DECIMAL)) as avg_severity,
    MAX(CAST(event_data->>'severity_score' AS DECIMAL)) as max_severity
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_ANALYTICS_EVENT'
    AND event_data->>'analysis_type' = 'ANOMALY_DETECTION'
    AND block_time >= NOW() - INTERVAL '7 days'
GROUP BY 1, 2
ORDER BY date DESC, anomaly_count DESC;

-- 9. Real-time Trust Protocol Health
-- Query: trust_protocol_health
SELECT 
    'Trust Declarations' as metric_type,
    COUNT(*) as count_24h,
    COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', block_time)) as change_from_prev_day
FROM symbi_trust_events 
WHERE event_type = 'TRUST_DECLARATION_PUBLISHED'
    AND block_time >= NOW() - INTERVAL '48 hours'
GROUP BY DATE_TRUNC('day', block_time)

UNION ALL

SELECT 
    'Governance Proposals' as metric_type,
    COUNT(*) as count_24h,
    COUNT(*) - LAG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', block_time)) as change_from_prev_day
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_PROPOSAL_CREATED'
    AND block_time >= NOW() - INTERVAL '48 hours'
GROUP BY DATE_TRUNC('day', block_time)

ORDER BY metric_type, count_24h DESC;

-- 10. Predictive Analytics Results
-- Query: predictive_analytics_results
SELECT 
    event_data->>'prediction_type' as prediction_type,
    event_data->>'target_metric' as target_metric,
    CAST(event_data->>'predicted_value' AS DECIMAL) as predicted_value,
    CAST(event_data->>'confidence_interval' AS DECIMAL) as confidence_interval,
    event_data->>'time_horizon' as time_horizon,
    block_time as prediction_time
FROM symbi_governance_events 
WHERE event_type = 'GOVERNANCE_ANALYTICS_EVENT'
    AND event_data->>'analysis_type' = 'PREDICTIVE_MODELING'
    AND block_time >= NOW() - INTERVAL '24 hours'
ORDER BY block_time DESC;