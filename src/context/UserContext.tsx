
'use client';
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseAuthUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';

type UserContextType = {
  user: UserProfile | null;
  loading: boolean;
  updateUserProfile: (data: Partial<Omit<UserProfile, 'uid'>>) => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser({ uid: authUser.uid, ...userSnap.data() } as UserProfile);
        } else {
          // Create a new user profile if it doesn't exist (e.g., for first-time Google sign-in)
          const newUserProfileData: Omit<UserProfile, 'uid'> = {
            name: authUser.displayName || 'New User',
            email: authUser.email || '',
            photoUrl: authUser.photoURL || `https://placehold.co/100x100.png?text=${(authUser.displayName || 'N').charAt(0)}`,
            profileType: 'personal',
            available: true,
          };
          await setDoc(userRef, newUserProfileData);
          setUser({ uid: authUser.uid, ...newUserProfileData });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserProfile = async (data: Partial<Omit<UserProfile, 'uid'>>) => {
    if (!user) {
      return;
    }
    
    setLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const wasProvider = user.profileType === 'provider';
    
    // Optimistically update local state
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    
    // Update Firestore user document
    await updateDoc(userRef, data);

    const providerRef = doc(db, 'providers', user.uid);

    // If user is now a provider, create/update the provider document
    if (updatedUser.profileType === 'provider') {
        const providerData = {
            name: updatedUser.name,
            category: updatedUser.category,
            phone_number: updatedUser.phone_number,
            avg_cost: updatedUser.avg_cost,
            available: updatedUser.available,
        };
        await setDoc(providerRef, providerData, { merge: true });
    } 
    // If user was a provider but is now personal, delete the provider document
    else if (wasProvider && updatedUser.profileType === 'personal') {
        await deleteDoc(providerRef);
    }
    
    setLoading(false);
  }

  const value = useMemo(() => ({ user, loading, updateUserProfile }), [user, loading]);

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
