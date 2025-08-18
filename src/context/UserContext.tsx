
'use client';
import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/lib/types';

// Mock user data for demonstration
const mockPersonalUser: UserProfile = {
  uid: 'mock-personal-user-123',
  name: 'Alex Rider',
  email: 'personal@example.com',
  photoUrl: 'https://placehold.co/100x100.png?text=A',
  profileType: 'personal',
};

const mockProviderUser: UserProfile = {
  uid: 'mock-provider-user-456',
  name: 'Pro Services Inc.',
  email: 'provider@example.com',
  photoUrl: 'https://placehold.co/100x100.png?text=P',
  profileType: 'provider',
  category: 'Home Services',
  phone_number: '555-0100',
  avg_cost: 100,
};

type UserContextType = {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: {email: string, profileType?: 'personal' | 'provider', name?: string}) => Promise<void>;
  updateUserProfile: (data: Partial<Omit<UserProfile, 'uid'>>) => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Simulate initial auth check
  useEffect(() => {
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials: {email: string, profileType?: 'personal' | 'provider', name?: string}) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Logic to determine which mock user to log in
    if (credentials.email.includes('provider') || credentials.profileType === 'provider') {
      setUser({...mockProviderUser, name: credentials.name || mockProviderUser.name, email: credentials.email});
    } else {
       setUser({...mockPersonalUser, name: credentials.name || mockPersonalUser.name, email: credentials.email});
    }
    setLoading(false);
  }, []);

  const updateUserProfile = useCallback(async (data: Partial<Omit<UserProfile, 'uid'>>) => {
    if (user) {
      setUser(currentUser => ({...currentUser!, ...data}));
    }
  }, [user]);

  const logout = useCallback(async () => {
    setUser(null);
  }, []);

  const value = useMemo(() => ({ 
    user, 
    loading, 
    login,
    updateUserProfile, 
    logout 
  }), [user, loading, login, updateUserProfile, logout]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
