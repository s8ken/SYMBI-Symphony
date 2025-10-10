import client from 'prom-client';

const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

// ML Prediction metrics
export const mlPredictTotal = new client.Counter({
  name: 'ml_predict_total',
  help: 'Total number of ML predictions',
  labelNames: ['agent', 'model'],
  registers: [registry]
});

export const mlPredictDuration = new client.Histogram({
  name: 'ml_predict_duration_ms',
  help: 'Duration of ML predictions in milliseconds',
  buckets: [5, 10, 20, 50, 100, 200, 500, 1000],
  registers: [registry]
});

// Anomaly detection metrics
export const mlAnomalyScore = new client.Histogram({
  name: 'ml_anomaly_score',
  help: 'Anomaly score distribution',
  buckets: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99],
  registers: [registry]
});

// Policy metrics
export const policyBudgetThreshold = new client.Counter({
  name: 'policy_budget_threshold_total',
  help: 'Budget threshold crossings',
  labelNames: ['scope', 'threshold'],
  registers: [registry]
});

export const policyBlockTotal = new client.Counter({
  name: 'policy_block_total',
  help: 'Total policy blocks',
  labelNames: ['reason'],
  registers: [registry]
});

export const policySuggestionTotal = new client.Counter({
  name: 'policy_suggestion_total',
  help: 'Total policy suggestions',
  labelNames: ['type'],
  registers: [registry]
});

export async function metricsHandler(req: any, res: any) {
  try {
    res.setHeader('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
}

export default registry;
