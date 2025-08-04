
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { UserNeed, ServiceProvider, UserProfile, ServiceRequest } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { matchCategory } from '@/ai/flows/match-category-flow';

const defaultProviders: (Omit<ServiceProvider, 'id'> & {id: string})[] = [
    { id: 'prov1', name: 'Speedy Movers', category: 'Moving', phone_number: '555-0101', avg_cost: 150, available: true },
    { id: 'prov2', name: 'Pro-Move Experts', category: 'Moving', phone_number: '555-0102', avg_cost: 200, available: false },
    { id: 'prov3', name: 'Brainy Tutors', category: 'Tutoring', phone_number: '555-0103', avg_cost: 50, available: true },
    { id: 'prov4', name: 'Tech Wizards', category: 'Tech Help', phone_number: '555-0104', avg_cost: 75, available: true },
    { id: 'prov5', name: 'Go-Get-It Errands', category: 'Errands', phone_number: '555-0105', avg_cost: 30, available: true },
    { id: 'prov6', name: 'Eventful Planners', category: 'Events', phone_number: '555-0106', avg_cost: 300, available: false },
    { id: 'prov7', name: 'Dr. Wellness', category: 'Doctor', phone_number: '555-0108', avg_cost: 250, available: true },
    { id: 'prov8', name: 'Fix-It-Fast', category: 'Plumbing', phone_number: '555-0109', avg_cost: 120, available: true },
    { id: 'prov9', name: 'Anytime Helper', category: 'Other', phone_number: '555-0107', avg_cost: 40, available: true },
];

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

    const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as ServiceRequest));

    return requests;
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
    const matchedProviders = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ServiceProvider)
    );
    return matchedProviders;
  } catch (error) {
    console.error('Error finding providers by category:', error);
    throw new Error('Could not fetch providers from the database.');
  }
}

/**
 * Analyzes a user's need description to find a matching category and then fetches providers.
 * @param description - The user's text description of their need.
 * @returns A promise that resolves to an array of matching ServiceProviders.
 */
export async function findProvidersBySmartSearch(description: string): Promise<ServiceProvider[]> {
    if (!description) {
        return [];
    }
    
    try {
        const allProvidersSnapshot = await getDocs(collection(db, 'providers'));
        if (allProvidersSnapshot.empty) {
            return []; // No providers in DB, no need to call AI.
        }
        
        const allCategories = [...new Set(allProvidersSnapshot.docs.map(doc => doc.data().category as string))];
        
        if (allCategories.length === 0) {
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
        if (error instanceof Error && error.message.includes('The AI service')) {
            throw error; // Re-throw AI service errors to be caught by the client
        }
        throw new Error('Could not perform provider search.');
    }
}
