
'use server';
/**
 * @fileOverview An AI agent that takes a job description, finds potential candidates on the web.
 *
 * - findProfiles - A function that orchestrates the profile finding process.
 * - FindProfilesInput - The input type for the findProfiles function.
 * - FindProfilesOutput - The return type for the findProfiles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {searchWebForExperts} from '../tools/search-web-tool';
import { marked } from 'marked';


const FindProfilesInputSchema = z.object({
  jobDescription: z.string().describe("The full job description text."),
});
export type FindProfilesInput = z.infer<typeof FindProfilesInputSchema>;


const FindProfilesOutputSchema = z.object({
  suggestedCandidates: z.array(z.object({
    name: z.string().describe("The full name of the professional. This must be a real name extracted from the search results."),
    link: z.string().describe("A direct URL link to the professional's profile (e.g., a real LinkedIn profile)."),
    summary: z.string().describe("A brief, one or two-sentence summary of why this professional is a good match based on the job description."),
  })).describe("A list of suggested professionals found from the web search."),
});
export type FindProfilesOutput = z.infer<typeof FindProfilesOutputSchema>;


export async function findProfiles(input: FindProfilesInput): Promise<FindProfilesOutput> {
  const result = await findProfilesFlow(input);

  // Sanitize and convert markdown to HTML for safe rendering.
  if (result.suggestedCandidates) {
    for (const candidate of result.suggestedCandidates) {
      // Use 'marked' to parse the summary which might contain markdown.
      const parsedSummary = await marked.parse(candidate.summary, { gfm: true, breaks: true });
      candidate.summary = parsedSummary;
    }
  }
  
  return result;
}

const findProfilesPrompt = ai.definePrompt({
  name: 'findProfilesPrompt',
  input: {schema: FindProfilesInputSchema},
  output: {schema: FindProfilesOutputSchema},
  tools: [searchWebForExperts],
  prompt: `You are an expert talent sourcer. Your task is to analyze a job description and find real, potential candidates on the web that match the role.

**Analysis Steps:**
1.  **Analyze Job Description**: Read the provided job description to understand the ideal candidate's skills and experience.
2.  **Identify Search Keywords**: Based on the job description, identify the key skills and the role title.
3.  **Use Web Search for Candidates**: Use the 'searchWebForExperts' tool with a query like "Top [Role Title] profiles on LinkedIn with [Skill 1] and [Skill 2]" to find potential candidates. Prioritize LinkedIn profiles.
4.  **Extract Real Information**: Review the search results carefully. You **MUST** extract the actual names of the professionals and the direct URLs to their real profiles. Do not invent names or links.
5.  **Summarize and Format**: Format the output according to the schema. For each candidate, provide their real name, a direct link to their profile, and a concise summary explaining why they are a good fit.

---

Job Description: 
\`\`\`
{{{jobDescription}}}
\`\`\`
`,
});

const findProfilesFlow = ai.defineFlow(
  {
    name: 'findProfilesFlow',
    inputSchema: FindProfilesInputSchema,
    outputSchema: FindProfilesOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await findProfilesPrompt(input);
      
      if (!output) {
        throw new Error('The AI agent failed to generate a response.');
      }
      
      return output;

    } catch (error) {
      console.error('Error in findProfilesFlow:', error);
      // Re-throw a more user-friendly error to be caught by the client
      throw new Error(
        'The AI service is currently unavailable or encountered an error. Please try again later.'
      );
    }
  }
);
