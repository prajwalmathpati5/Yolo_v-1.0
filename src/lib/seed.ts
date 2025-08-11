
/**
 * @fileoverview This file contains the script for seeding the Firestore database
 * with a default set of service providers. Run this script using `npm run seed:providers`.
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import type { ServiceProvider } from './types';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export const defaultProviders: (Omit<ServiceProvider, 'id'> & {id: string})[] = [
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
 * Main seeding function. This is intended to be run from the command line.
 */
async function main() {
  // Check for required environment variables
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  ) {
    console.error(
      'Firebase configuration is missing. Make sure your .env.local file is set up correctly.'
    );
    process.exit(1);
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const providersRef = collection(db, 'providers');

    console.log('Starting to seed providers...');

    for (const provider of defaultProviders) {
      const { id, ...providerData } = provider;
      await setDoc(doc(providersRef, id), providerData);
      console.log(`  - Seeded ${provider.name} (${id})`);
    }

    console.log(`\nSuccessfully seeded ${defaultProviders.length} providers.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding providers:', error);
    process.exit(1);
  }
}

// Check if the script is being run directly from the command line
if (require.main === module) {
  main();
}
