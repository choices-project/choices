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

export type { ElectedOfficial as default };
