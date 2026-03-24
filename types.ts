export interface Server {
  id: string;
  name: string;
  country: string;
  flag: string;
  ip: string;
  isPro: boolean;
  ping?: number;
  category?: 'Recommended' | 'Fast' | 'All' | 'Premium' | 'Streaming' | 'Gaming' | 'Social';
  type?: 'Standard' | 'Dedicated' | 'Ultra Speed' | 'Static IP' | 'P2P' | 'Torrent' | 'Secure Core' | 'Dedicated IP' | 'Streaming' | 'Gaming';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isPro: boolean;
  isPremium: boolean;
  subscriptionExpires?: string;
  sessionTimeRemaining?: number;
}
