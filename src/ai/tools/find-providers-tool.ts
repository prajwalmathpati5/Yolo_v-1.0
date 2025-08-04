'use server';
/**
 * @fileOverview A Genkit tool for finding available service providers for a project.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ServiceProvider } from '@/lib/types';

export const findProvidersForProject = ai.defineTool(
  {
    name: 'findProvidersForProject',
    description: 'Finds available service providers based on a service category or role. Use this when a user needs to find a professional for a specific task.',
    inputSchema: z.object({
      category: z.string().describe('A single service category or role to search for (e.g., "Plumbing", "Web Developer").'),
    }),
    outputSchema: z.array(z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        phone_number: z.string(),
        avg_cost: z.number(),
        available: z.boolean(),
    })),
  },
  async (input) => {
    if (!input.category) {
      return [];
    }

    try {
      const providersRef = collection(db, 'providers');
      
      const q = query(
        providersRef,
        where('category', '==', input.category),
        where('available', '==', true)
      );

      const querySnapshot = await getDocs(q);
      
      const matchedProviders = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as ServiceProvider)
      );

      return matchedProviders;
    } catch (error) {
      console.error('Error finding providers for project:', error);
      // Return empty array on error to allow the chatbot to respond gracefully.
      return [];
    }
  }
);
