
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, doc, getDoc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import type { UserNeed, ServiceProvider, UserProfile, ServiceRequest, ChatConversation } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { matchCategory } from '@/ai/flows/match-category-flow';
import { defaultProviders } from '@/lib/seed';

import type { User } from 'firebase/auth';


/**
 * Seeds the Firestore database with a default set of service providers.
 * This function is idempotent; it will not create duplicates if run multiple times.
 */
export async function seedProviders() {
    try {
        const providersRef = collection(db, 'providers');
        for (const provider of defaultProviders) {
            const { id, ...providerData } = provider;
            await setDoc(doc(providersRef, id), providerData);
        }
        console.log('Successfully seeded providers.');
        return { success: true, message: `Successfully seeded ${defaultProviders.length} providers.` };
    } catch(error) {
        console.error("Error seeding providers:", error);
        if (error instanceof Error) {
           return { success: false, message: error.message };
        }
        return { success: false, message: 'An unknown error occurred.' };
    }
}

/**
 * Gets a user's profile from Firestore or creates it if it doesn't exist.
 * This function is called upon user login/signup to ensure a profile document exists.
 * @param firebaseUser - The user object from Firebase Auth.
 * @returns A promise that resolves to the user's profile data.
 */
export async function getOrCreateUserProfile(
  firebaseUser: User
): Promise<UserProfile> {
  const userDocRef = doc(db, 'users', firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    // If the document exists, return it.
    return userDocSnap.data() as UserProfile;
  } else {
    // This part should ideally be handled by the onUserCreate Cloud Function
    // for reliability, but we can have a client-side fallback.
    // This is especially useful for Google Sign-In where there's no separate "signup" step.
    console.warn(`Profile for ${firebaseUser.uid} not found. Creating a default profile.`);
    const newUserProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || "New User",
      photoUrl: firebaseUser.photoURL || `https://placehold.co/100x100.png?text=${(firebaseUser.displayName || "N").charAt(0)}`,
      profileType: "personal", // Default to personal for new sign-ups
    };

    try {
      await setDoc(userDocRef, newUserProfile);
      return newUserProfile;
    } catch (error) {
      console.error(`Error creating fallback profile for user: ${firebaseUser.uid}`, error);
      // If creation fails, we must throw an error.
      throw new Error('Could not create user profile.');
    }
  }
}


// Define the input type for adding a need
type AddNeedInput = {
    description: string;
    category: string;
    imageUrl?: string;
    userId: string;
};

/**
 * Adds a new need to Firestore. This is the first step in the user's journey.
 * The user will then be shown a list of providers to whom they can send a request.
 * @param needData - The need data from the client.
 * @returns A promise that resolves to the newly created UserNeed object with its ID.
 */
export async function addNeed(needData: AddNeedInput): Promise<UserNeed> {
    const userNeedData: Omit<UserNeed, 'id' | 'timestamp'> & { timestamp: any } = {
        description: needData.description,
        category: needData.category,
        userId: needData.userId,
        status: 'Pending',
        timestamp: serverTimestamp(),
    };

    if (needData.imageUrl) {
        userNeedData.imageUrl = needData.imageUrl;
    }

    const needsCollection = collection(db, 'needs');
    const needDocRef = await addDoc(needsCollection, userNeedData);

    revalidatePath('/home');
    revalidatePath('/activity');

    return { ...userNeedData, id: needDocRef.id, timestamp: new Date() }; // Return with ID
}

/**
 * Sends a request from a user to a specific service provider for a given need.
 * @param {object} params - The parameters for sending the request.
 * @param {string} params.providerId - The ID of the provider to receive the request.
 * @param {string} params.needId - The ID of the need document.
 * @param {UserProfile} params.user - The full user profile object of the user making the request.
 */
export async function sendRequestToProvider({ providerId, needId, user }: { providerId: string, needId: string, user: UserProfile }) {
    const needRef = doc(db, 'needs', needId);
    const needSnap = await getDoc(needRef);

    if (!needSnap.exists()) {
        throw new Error("Need not found!");
    }
    const needData = needSnap.data() as UserNeed;

    // Get the provider's details to store the cost
    const providerRef = doc(db, 'providers', providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists()) {
        throw new Error("Provider not found!");
    }
    const providerData = providerSnap.data() as ServiceProvider;


    const requestRef = doc(db, 'providers', providerId, 'requests', needId);
    
    // Check if a request already exists to prevent duplicates
    const requestSnap = await getDoc(requestRef);
    if(requestSnap.exists()){
        console.log("Request already sent to this provider.");
        return;
    }

    await setDoc(requestRef, {
        needId: needId,
        userId: user.uid,
        user: { // Store denormalized user data
            name: user.name,
            photoUrl: user.photoUrl,
            email: user.email,
        },
        description: needData.description,
        category: needData.category,
        requestTimestamp: serverTimestamp(),
        status: 'Pending', // Initial status for the provider
        cost: providerData.avg_cost, // Store the cost at the time of request
    });

    revalidatePath(`/provider/dashboard`);
}

/**
 * Fetches all service requests for a given provider.
 * @param providerId The ID of the provider.
 * @returns A promise resolving to an array of ServiceRequest objects.
 */
export async function getServiceRequests(providerId: string): Promise<ServiceRequest[]> {
    const requestsRef = collection(db, 'providers', providerId, 'requests');
    const q = query(requestsRef); // You can add ordering here, e.g., orderBy('requestTimestamp', 'desc')
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ServiceRequest));
}


type UpdateRequestStatusInput = {
    providerId: string;
    requestId: string; // This is the same as the needId
    needId: string;
    status: 'Accepted' | 'Declined' | 'Completed';
}

/**
 * Updates the status of a service request by a provider.
 * If the status is 'Accepted', it also updates the original need's status to 'Approved'.
 * @param params - The input data for updating the status.
 */
export async function updateRequestStatus({ providerId, requestId, needId, status }: UpdateRequestStatusInput) {
    const requestRef = doc(db, 'providers', providerId, 'requests', requestId);
    const needRef = doc(db, 'needs', needId);

    const providerRef = doc(db, 'providers', providerId);
    const providerSnap = await getDoc(providerRef);
    if (!providerSnap.exists()) {
        throw new Error("Provider not found!");
    }
    const providerData = providerSnap.data() as ServiceProvider;


    await updateDoc(requestRef, { status: status });

    const needUpdates: { status: string; provider?: any, cost?: number } = { status: '' };

    if (status === 'Accepted') {
        needUpdates.status = 'Approved';
        needUpdates.provider = {
            name: providerData.name,
            avatar: `https://placehold.co/40x40.png?text=${providerData.name.charAt(0)}`
        };
        needUpdates.cost = providerData.avg_cost;
    } else if (status === 'Completed') {
        needUpdates.status = 'Completed';
    } else if (status === 'Declined') {
        needUpdates.status = 'Pending'; // Revert to pending so user can find another provider.
    }

    if (needUpdates.status) {
      await updateDoc(needRef, needUpdates);
    }
    
    revalidatePath('/activity');
    revalidatePath(`/provider/dashboard`);
}


/**
 * Finds service providers by a given category.
 * @param category - The category to search for.
 * @returns A promise that resolves to an array of matching ServiceProviders.
 */
export async function findProvidersByCategory(
  category: string
): Promise<ServiceProvider[]> {
  if (!category) {
    return [];
  }

  try {
    const providersRef = collection(db, 'providers');
    const q = query(
        providersRef,
        where('category', '==', category.trim()),
        where('available', '==', true) // Only find available providers
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ServiceProvider)
    );
  } catch (error) {
    console.error('Error finding providers by category:', error);
    throw new Error('Could not fetch providers from the database.');
  }
}

/**
 * Analyzes a user's need description to find a matching category and then fetches providers.
 * This function is self-healing: if no providers are found, it will seed the database.
 * @param description - The user's text description of their need.
 * @returns A promise that resolves to an array of matching ServiceProviders.
 */
export async function findProvidersBySmartSearch(description: string): Promise<ServiceProvider[]> {
    if (!description) {
        return [];
    }
    
    try {
        let allProvidersSnapshot = await getDocs(collection(db, 'providers'));
        
        // Self-healing: If no providers exist, seed them.
        if (allProvidersSnapshot.empty) {
            console.log("No providers found in the database. Seeding now...");
            await seedProviders();
            // Re-fetch after seeding
            allProvidersSnapshot = await getDocs(collection(db, 'providers'));
            if (allProvidersSnapshot.empty) {
                 console.error("Seeding failed. No providers available.");
                 return []; // Still empty after attempting to seed.
            }
        }
        
        const allCategories = [...new Set(allProvidersSnapshot.docs.map(doc => doc.data().category as string))];
        
        if (allCategories.length === 0) {
            console.warn("Providers exist, but no categories could be extracted.");
            return [];
        }
        
        const result = await matchCategory({ userQuery: description, availableCategories: allCategories });

        if (result.matchedCategory) {
            console.log(`AI matched to category: ${result.matchedCategory}`);
            return findProvidersByCategory(result.matchedCategory);
        }

        // Return empty if AI could not match a category
        return [];

    } catch (error) {
        console.error('Error in findProvidersBySmartSearch:', error);
        throw new Error('An unexpected error occurred while searching for providers.');
    }
}


/**
 * Saves or updates a conversation in the user's history.
 * @param userId The ID of the user.
 * @param conversation The conversation data to save.
 * @returns The ID of the saved conversation document.
 */
export async function saveOrUpdateConversation(userId: string, conversation: ChatConversation): Promise<string> {
    const { id, ...convoData } = conversation;
    const historyRef = collection(db, 'users', userId, 'conversations');

    if (id) {
        // This is an existing conversation, update it.
        const docRef = doc(historyRef, id);
        await updateDoc(docRef, convoData);
        revalidatePath('/capture');
        return id;
    } else {
        // This is a new conversation, add it.
        const newDocRef = await addDoc(historyRef, {
            ...convoData,
            timestamp: serverTimestamp(),
        });
        revalidatePath('/capture');
        return newDocRef.id;
    }
}


/**
 * Fetches the conversation history for a specific user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of conversation objects.
 */
export async function getConversationHistory(userId: string): Promise<ChatConversation[]> {
    const historyRef = collection(db, 'users', userId, 'conversations');
    const q = query(historyRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
         // Make sure timestamp is a Date object, not a Firestore Timestamp
        timestamp: (doc.data().timestamp as Timestamp)?.toDate() || new Date(),
    } as ChatConversation));
}

/**
 * Fetches a single conversation by its ID.
 * @param userId The ID of the user.
 * @param conversationId The ID of the conversation.
 * @returns A promise that resolves to the conversation object or null if not found.
 */
export async function getConversation(userId: string, conversationId: string): Promise<ChatConversation | null> {
    const docRef = doc(db, 'users', userId, 'conversations', conversationId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        return {
            id: docSnap.id,
            ...data,
            timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
        } as ChatConversation;
    } else {
        return null;
    }
}
