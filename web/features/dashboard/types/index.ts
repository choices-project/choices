export interface PersonalAnalytics {
  user_id: string;
  total_votes: number;
  total_polls_created: number;
  active_polls: number;
  total_votes_on_user_polls: number;
  recent_activity: {
    votes_last_30_days: number;
    polls_created_last_30_days: number;
  };
  participation_score: number;
  recent_votes: Array<{
    id: string;
    poll_id: string;
    created_at: string;
  }>;
  recent_polls: Array<{
    id: string;
    title: string;
    created_at: string;
    total_votes: number;
    status: string;
  }>;
}

export interface ElectedOfficial {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  photo_url?: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
    social_media?: {
      twitter?: string;
      facebook?: string;
    };
  };
}

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  description: string;
}
