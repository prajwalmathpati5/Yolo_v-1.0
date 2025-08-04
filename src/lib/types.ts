import type { Timestamp } from 'firebase/firestore';

export type Need = {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  description: string;
  imageUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  timestamp: Date;
  provider?: {
    name: string;
    avatar: string;
  };
  cost?: number;
  rating?: number;
  feedback?: string;
  isPaid?: boolean;
};

export type Message = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  text: string;
  timestamp: Date;
  isCurrentUser: boolean;
  matchedProviders?: ServiceProvider[];
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  photoUrl: string;
  profileType: 'personal' | 'provider';
  available: boolean;
  // Provider-specific fields
  category?: string;
  phone_number?: string;
  avg_cost?: number;
};

// Represents a need document in the /needs collection
export type UserNeed = {
  id?: string;
  userId: string;
  description: string;
  imageUrl?: string;
  category: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  timestamp: any; // Firestore serverTimestamp or Date
};

// Represents a provider document in the /providers collection
export type ServiceProvider = {
  id: string;
  name:string;
  category: string;
  phone_number: string;
  avg_cost: number;
  available: boolean;
}

// Represents a request document in the /providers/{providerId}/requests subcollection
export type ServiceRequest = {
  id: string; // This will be the needId
  needId: string;
  userId: string;
  user: {
    name: string;
    photoUrl: string;
    email: string;
  };
  description: string;
  category: string;
  requestTimestamp: Timestamp;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Completed';
  cost?: number;
};
