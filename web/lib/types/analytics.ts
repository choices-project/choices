// Minimal placeholders; replace with real types when available
export type MetricId = string;
export interface AnalyticsEvent {
  id: MetricId;
  name: string;
  ts: number;
  props?: Record<string, unknown>;
}



