// API Types
export interface TokenResponse {
  token: string;
  tag: string;
  issued_at: string;
  expires_at: string;
  tier: string;
  scope: string;
  public_key: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: string[];
  status: 'draft' | 'active' | 'closed';
  start_time: string;
  end_time: string;
  sponsors: string[];
  created_at: string;
}

export interface Vote {
  poll_id: string;
  token: string;
  tag: string;
  choice: number;
  voted_at: string;
  merkle_leaf: string;
  merkle_proof: string[];
}

export interface Tally {
  [key: number]: number;
}

export interface CommitmentLog {
  leaf_count: number;
  root: string;
  timestamp: string;
}

// Dashboard Types
export interface DashboardData {
  polls: PollSummary[];
  overall_metrics: OverallMetrics;
  trends: TrendData[];
  geographic_map: GeographicMap;
  demographics: DemographicsData;
  engagement: EngagementMetrics;
}

export interface PollSummary {
  id: string;
  title: string;
  status: string;
  total_votes: number;
  participation: number;
  created_at: string;
  ends_at: string;
  choices: Choice[];
}

export interface Choice {
  id: string;
  text: string;
  votes: number;
}

export interface OverallMetrics {
  total_polls: number;
  active_polls: number;
  total_votes: number;
  total_users: number;
  average_participation: number;
}

export interface TrendData {
  date: string;
  votes: number;
  users: number;
  polls: number;
}

export interface GeographicMap {
  regions: GeographicRegion[];
  countries: GeographicCountry[];
  heatmap: HeatmapPoint[];
}

export interface GeographicRegion {
  name: string;
  vote_count: number;
  population: number;
  percentage: number;
  latitude: number;
  longitude: number;
}

export interface GeographicCountry {
  code: string;
  name: string;
  vote_count: number;
  population: number;
  percentage: number;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number;
}

export interface DemographicsData {
  age_groups: Record<string, number>;
  genders: Record<string, number>;
  education: Record<string, number>;
  income: Record<string, number>;
  verification_tiers: Record<string, number>;
}

export interface EngagementMetrics {
  active_users: number;
  new_users: number;
  returning_users: number;
  session_duration: number;
  bounce_rate: number;
}

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  Vote: { pollId: string };
  Results: { pollId: string };
};

export type TabParamList = {
  Home: undefined;
  Dashboard: undefined;
  Polls: undefined;
  Profile: undefined;
};

// User Types
export interface User {
  id: string;
  stable_id: string;
  email?: string;
  tier: string;
  created_at: string;
  last_login: string;
}

// App State Types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
