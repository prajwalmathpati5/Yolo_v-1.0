'use server';
/**
 * @fileOverview An AI flow to match a user's query to an existing service category.
 *
 * - matchCategory - A function that handles matching a user query to a list of categories.
 * - MatchCategoryInput - The input type for the matchCategory function.
 * - MatchCategoryOutput - The return type for the matchCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MatchCategoryInputSchema = z.object({
  userQuery: z.string().describe("The user's search query for a service."),
  availableCategories: z.array(z.string()).describe('The list of available service categories to choose from.'),
});
export type MatchCategoryInput = z.infer<typeof MatchCategoryInputSchema>;

const MatchCategoryOutputSchema = z.object({
  matchedCategory: z.string().describe('The single best matching category from the available list. If no good match is found, return an empty string.'),
});
export type MatchCategoryOutput = z.infer<typeof MatchCategoryOutputSchema>;

export async function matchCategory(input: MatchCategoryInput): Promise<MatchCategoryOutput> {
  return matchCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchCategoryPrompt',
  input: {schema: MatchCategoryInputSchema},
  output: {schema: MatchCategoryOutputSchema},
  prompt: `You are an intelligent assistant that matches a user's request to a predefined list of service categories.
Your task is to analyze the user's query and select the most relevant category from the provided list.
The user's query might be a synonym, a broader term, or a specific example of a service.
For example, if the user query is "healthcare" and the available categories include "Doctor", "Plumber", you should match it to "Doctor".
If the query is "fix a leaky pipe", it should match "Plumbing".

Return only the single best matching category from the list. If there is no reasonably close match in the list, return an empty string for the matchedCategory.

User Query: "{{userQuery}}"

Available Categories:
{{#each availableCategories}}
- {{this}}
{{/each}}
`,
});

const matchCategoryFlow = ai.defineFlow(
  {
    name: 'matchCategoryFlow',
    inputSchema: MatchCategoryInputSchema,
    outputSchema: MatchCategoryOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await prompt(input);
        return output!;
    } catch (error) {
        console.error("Error in matchCategoryFlow:", error);
        // Re-throw a more user-friendly error to be caught by the client
        throw new Error("The AI service is currently unavailable or encountered an error. Please try again later.");
    }
  }
);
