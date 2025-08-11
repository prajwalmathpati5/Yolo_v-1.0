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
  jobDescription: z.string().describe("Required Skills."),
});
export type FindProfilesInput = z.infer<typeof FindProfilesInputSchema>;


const FindProfilesOutputSchema = z.object({
  suggestedCandidates: z.array(z.object({
    name: z.string().describe("The full name of the professional. This must be a real name extracted from the search results."),
    link: z.string().describe("A direct URL to the professional's profile (e.g., a real LinkedIn profile)."),
    summary: z.string().describe("A brief, one or two-sentence summary of why this professional is a good match based on the job description."),
    thumbnail: z.string().optional().describe("The URL of the professional's profile picture, if available."),
  })).describe("A list of suggested professionals found from the web search."),
});
export type FindProfilesOutput = z.infer<typeof FindProfilesOutputSchema>;


export async function findProfiles(input: FindProfilesInput): Promise<FindProfilesOutput> {
  console.log('findProfiles input:', input);
  const result = await findProfilesFlow(input);
  console.log('findProfilesFlow result:', result);

  // Sanitize and convert markdown to HTML for safe rendering.
  if (result.suggestedCandidates) {
    for (const candidate of result.suggestedCandidates) {
      // Always provide thumbnail as a string
      
      // Use 'marked' to parse the summary which might contain markdown.
      const parsedSummary = await marked.parse(candidate.summary, { gfm: true, breaks: true });
      candidate.summary = parsedSummary;
    }
  }
  return result;
}

const findProfilesPrompt = ai.definePrompt({
  name: 'findProfilesPrompt',
  input: { schema: FindProfilesInputSchema },
  output: { schema: FindProfilesOutputSchema },
  tools: [searchWebForExperts],
  prompt: `
You are an expert talent sourcer AI. Your goal is to find real, verifiable professionals for the given Job Description (JD).  



**Process**:
1. Read the JD carefully and extract:
   - Role Title
   - 3-5 mandatory skills/technologies.
2. Build a query in this format:
   \`LinkedIn profile of [Role Title] with [Skill1], [Skill2], [Skill3]\`
3. Call \`searchWebForExperts\` with the constructed query.
4. From the results, only keep profiles that explicitly match at least 2 skills.
5. Return exactly 3-5 candidates with:
   - name (real, exact spelling from profile)
   - link (direct to LinkedIn or equivalent)
   - summary (why they match, referencing skills from JD)
  

**Job Description**:
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
        console.warn('The AI agent failed to generate a response for findProfilesPrompt.');
        return { suggestedCandidates: [] };
      }
      
      return output;

    } catch (error) {
      console.error('Error in findProfilesFlow:', error);
      return { suggestedCandidates: [] };
    }
  }
);
