
'use server';
/**
 * @fileOverview An AI agent that analyzes user requirements for hiring or team building
 * and generates a professional job description.
 *
 * - hiringAssistant - A function that orchestrates the hiring assistant process.
 * - HiringAssistantInput - The input type for the hiringAssistant function.
 * - HiringAssistantOutput - The return type for the hiringAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { marked } from 'marked';

const HiringAssistantInputSchema = z.object({
  need: z
    .string()
    .describe(
      "The user's requirement, e.g., 'I want to hire an AI engineer for an app project'."
    ),
});
export type HiringAssistantInput = z.infer<typeof HiringAssistantInputSchema>;

const HiringAssistantOutputSchema = z.object({
  jobDescription: z.string().describe("A professional job description formatted in markdown, based on the user's need. It should include sections like Role, Responsibilities, and Skills."),
});
export type HiringAssistantOutput = z.infer<typeof HiringAssistantOutputSchema>;

export async function hiringAssistant(input: HiringAssistantInput): Promise<HiringAssistantOutput> {
  const result = await hiringAssistantFlow(input);

  // We are NOT parsing markdown here anymore, as we need the raw text for other flows.
  // The UI will handle the markdown parsing for display.
  
  return result;
}

const hiringAssistantPrompt = ai.definePrompt({
  name: 'hiringAssistantPrompt',
  input: {schema: HiringAssistantInputSchema},
  output: {schema: HiringAssistantOutputSchema},
  prompt: `You are an expert hiring assistant. Your task is to analyze a user's hiring need and generate a professional job description.
Your output MUST use markdown for formatting (e.g., **bold headings**, bullet points).
The job description should include sections for the Role Title, Responsibilities, and Required Skills.

User Need: {{{need}}}
`,
});


const hiringAssistantFlow = ai.defineFlow(
  {
    name: 'hiringAssistantFlow',
    inputSchema: HiringAssistantInputSchema,
    outputSchema: HiringAssistantOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await hiringAssistantPrompt(input);
      
      if (!output) {
        throw new Error('The AI agent failed to generate a response.');
      }
      
      return output;

    } catch (error) {
      console.error('Error in hiringAssistantFlow:', error);
      // Re-throw a more user-friendly error to be caught by the client
      throw new Error(
        'The AI service is currently unavailable or encountered an error. Please try again later.'
      );
    }
  }
);
