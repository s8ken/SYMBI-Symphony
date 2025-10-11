-- SYMBI Trust Protocol - Governance Events Analytics
-- This query tracks bicameral governance activities, proposals, and voting patterns

WITH governance_events AS (
  SELECT 
    event_id,
    event_type,
    event_timestamp,
    block_number,
    transaction_hash,
    -- Governance body classification
    CASE 
      WHEN event_data->>'governance_body' = 'house_of_work' THEN 'House of Work'
      WHEN event_data->>'governance_body' = 'house_of_stewardship' THEN 'House of Stewardship'
      ELSE 'Constitutional'
    END as governance_body,
    -- Event details
    event_data->>'proposal_id' as proposal_id,
    event_data->>'proposal_title' as proposal_title,
    event_data->>'proposer_id' as proposer_id,
    event_data->>'vote_type' as vote_type,
    event_data->>'vote_weight' as vote_weight,
    (event_data->>'vote_weight')::numeric as vote_weight_numeric,
    event_data->>'constitutional_article' as constitutional_article,
    -- Trust metrics
    (event_data->>'trust_score')::numeric as trust_score,
    (event_data->>'reputation_score')::numeric as reputation_score
  FROM symbi_governance_events
  WHERE event_timestamp >= CURRENT_DATE - INTERVAL '30 days'
),

proposal_metrics AS (
  SELECT
    proposal_id,
    proposal_title,
    governance_body,
    MIN(event_timestamp) as proposal_created,
    MAX(event_timestamp) as last_activity,
    COUNT(CASE WHEN event_type = 'vote_cast' THEN 1 END) as total_votes,
    COUNT(CASE WHEN event_type = 'vote_cast' AND vote_type = 'for' THEN 1 END) as votes_for,
    COUNT(CASE WHEN event_type = 'vote_cast' AND vote_type = 'against' THEN 1 END) as votes_against,
    COUNT(CASE WHEN event_type = 'vote_cast' AND vote_type = 'abstain' THEN 1 END) as votes_abstain,
    SUM(CASE WHEN event_type = 'vote_cast' AND vote_type = 'for' THEN vote_weight_numeric ELSE 0 END) as weight_for,
    SUM(CASE WHEN event_type = 'vote_cast' AND vote_type = 'against' THEN vote_weight_numeric ELSE 0 END) as weight_against,
    AVG(CASE WHEN event_type = 'vote_cast' THEN trust_score END) as avg_voter_trust_score
  FROM governance_events
  WHERE proposal_id IS NOT NULL
  GROUP BY proposal_id, proposal_title, governance_body
),

daily_governance_activity AS (
  SELECT
    DATE_TRUNC('day', event_timestamp) as date,
    governance_body,
    COUNT(*) as total_events,
    COUNT(DISTINCT proposal_id) as active_proposals,
    COUNT(CASE WHEN event_type = 'proposal_created' THEN 1 END) as new_proposals,
    COUNT(CASE WHEN event_type = 'vote_cast' THEN 1 END) as votes_cast,
    COUNT(CASE WHEN event_type = 'proposal_executed' THEN 1 END) as proposals_executed,
    AVG(trust_score) as avg_participant_trust_score,
    COUNT(DISTINCT proposer_id) as unique_participants
  FROM governance_events
  GROUP BY DATE_TRUNC('day', event_timestamp), governance_body
)

-- Main query combining all metrics
SELECT 
  'proposal_summary' as metric_type,
  proposal_id,
  proposal_title,
  governance_body,
  proposal_created,
  last_activity,
  total_votes,
  votes_for,
  votes_against,
  votes_abstain,
  ROUND(weight_for, 2) as weight_for,
  ROUND(weight_against, 2) as weight_against,
  CASE 
    WHEN (weight_for + weight_against) > 0 
    THEN ROUND(weight_for / (weight_for + weight_against) * 100, 1)
    ELSE 0 
  END as approval_percentage,
  ROUND(avg_voter_trust_score, 3) as avg_voter_trust_score,
  NULL::date as date,
  NULL::bigint as total_events,
  NULL::bigint as active_proposals,
  NULL::bigint as new_proposals,
  NULL::bigint as votes_cast,
  NULL::bigint as proposals_executed,
  NULL::numeric as avg_participant_trust_score,
  NULL::bigint as unique_participants
FROM proposal_metrics

UNION ALL

SELECT 
  'daily_activity' as metric_type,
  NULL as proposal_id,
  NULL as proposal_title,
  governance_body,
  NULL as proposal_created,
  NULL as last_activity,
  NULL as total_votes,
  NULL as votes_for,
  NULL as votes_against,
  NULL as votes_abstain,
  NULL as weight_for,
  NULL as weight_against,
  NULL as approval_percentage,
  NULL as avg_voter_trust_score,
  date,
  total_events,
  active_proposals,
  new_proposals,
  votes_cast,
  proposals_executed,
  ROUND(avg_participant_trust_score, 3) as avg_participant_trust_score,
  unique_participants
FROM daily_governance_activity

ORDER BY 
  metric_type,
  COALESCE(date, proposal_created) DESC;