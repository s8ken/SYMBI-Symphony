/**
 * Metrics collection for the SYMBI Symphony platform
 */

import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export class MetricsCollector {
  private registry: Registry;
  private counters: Map<string, Counter<string>> = new Map();
  private histograms: Map<string, Histogram<string>> = new Map();
  private gauges: Map<string, Gauge<string>> = new Map();

  constructor() {
    this.registry = new Registry();
  }

  createCounter(name: string, help: string, labelNames?: string[]): Counter<string> {
    const counter = new Counter({ name, help, labelNames, registers: [this.registry] });
    this.counters.set(name, counter);
    return counter;
  }

  createHistogram(name: string, help: string, labelNames?: string[], buckets?: number[]): Histogram<string> {
    const histogram = new Histogram({ name, help, labelNames, buckets, registers: [this.registry] });
    this.histograms.set(name, histogram);
    return histogram;
  }

  createGauge(name: string, help: string, labelNames?: string[]): Gauge<string> {
    const gauge = new Gauge({ name, help, labelNames, registers: [this.registry] });
    this.gauges.set(name, gauge);
    return gauge;
  }

  getCounter(name: string): Counter<string> | undefined {
    return this.counters.get(name);
  }

  getHistogram(name: string): Histogram<string> | undefined {
    return this.histograms.get(name);
  }

  getGauge(name: string): Gauge<string> | undefined {
    return this.gauges.get(name);
  }

  getMetrics(): string {
    return this.registry.metrics();
  }

  clear(): void {
    this.registry.clear();
  }
}

export const metrics = new MetricsCollector();