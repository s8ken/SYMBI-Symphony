import { Injectable } from '@nestjs/common';
import * as ss from 'simple-statistics';
import { Logger } from '@nestjs/common';

interface CostPoint {
  timestamp: number;
  agentId: string;
  modelId: string;
  tokens: number;
  costUsd: number;
  latencyMs: number;
}

interface PredictionResult {
  predictedCost: number;
  confidence: number;
  p90Cost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

@Injectable()
export class CostPredictor {
  private readonly logger = new Logger(CostPredictor.name);
  private readonly windowSize = 100;
  private readonly forecastHorizon = 3600; // 1 hour

  predictCost(recentPoints: CostPoint[]): PredictionResult {
    if (!recentPoints || recentPoints.length < 5) {
      return {
        predictedCost: 0,
        confidence: 0,
        p90Cost: 0,
        trend: 'stable'
      };
    }

    const costs = recentPoints.map(p => p.costUsd);
    const timestamps = recentPoints.map(p => p.timestamp);

    // Simple linear regression for trend
    const regression = ss.linearRegression(
      timestamps.map(t => [t - timestamps[0], 0]),
      costs
    );

    const slope = regression.m;
    const intercept = regression.b;

    // Calculate trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.001) {
      trend = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Calculate confidence based on R²
    const rSquared = ss.rSquared(
      timestamps.map(t => [t - timestamps[0], 0]),
      costs
    );
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Predict next hour
    const lastTimestamp = Math.max(...timestamps);
    const predictedCost = slope * this.forecastHorizon + intercept;

    // Calculate p90 using recent distribution
    const p90Cost = ss.quantile(costs, 0.9);

    this.logger.debug(`Cost prediction: ${predictedCost.toFixed(4)} USD, confidence: ${(confidence * 100).toFixed(1)}%, trend: ${trend}`);

    return {
      predictedCost: Math.max(0, predictedCost),
      confidence,
      p90Cost,
      trend
    };
  }

  detectAnomaly(points: CostPoint[]): { score: number; isAnomaly: boolean } {
    if (!points || points.length < 10) {
      return { score: 0, isAnomaly: false };
    }

    const costs = points.map(p => p.costUsd);
    
    // Use z-score for anomaly detection
    const mean = ss.mean(costs);
    const std = ss.standardDeviation(costs);
    
    if (std === 0) {
      return { score: 0, isAnomaly: false };
    }

    const lastCost = costs[costs.length - 1];
    const zScore = Math.abs((lastCost - mean) / std);
    
    // Normalize to 0-1 scale
    const normalizedScore = Math.min(1, zScore / 3);
    
    return {
      score: normalizedScore,
      isAnomaly: normalizedScore >= 0.8
    };
  }
}
