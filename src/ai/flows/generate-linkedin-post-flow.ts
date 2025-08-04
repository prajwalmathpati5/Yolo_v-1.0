
'use server';
/**
 * @fileOverview An AI flow to generate a compelling LinkedIn post from a job description.
 *
 * - generateLinkedInPost - A function that creates a LinkedIn post.
 * - GenerateLinkedInPostInput - The input type for the generateLinkedInPost function.
 * - GenerateLinkedInPostOutput - The return type for the generateLinkedInPost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { marked } from 'marked';

const GenerateLinkedInPostInputSchema = z.object({
  jobDescription: z.string().describe("The full job description text, formatted in markdown."),
});
export type GenerateLinkedInPostInput = z.infer<typeof GenerateLinkedInPostInputSchema>;

const GenerateLinkedInPostOutputSchema = z.object({
  linkedInPost: z.string().describe("A compelling LinkedIn post generated from the job description, formatted in markdown. It should be engaging and include relevant hashtags."),
});
export type GenerateLinkedInPostOutput = z.infer<typeof GenerateLinkedInPostOutputSchema>;


export async function generateLinkedInPost(input: GenerateLinkedInPostInput): Promise<GenerateLinkedInPostOutput> {
  const result = await generateLinkedInPostFlow(input);
  // Sanitize and convert markdown to HTML for safe rendering.
  const parsed = await marked.parse(result.linkedInPost, { gfm: true, breaks: true });
  result.linkedInPost = parsed;
  return result;
}

const generateLinkedInPostPrompt = ai.definePrompt({
  name: 'generateLinkedInPostPrompt',
  input: {schema: GenerateLinkedInPostInputSchema},
  output: {schema: GenerateLinkedInPostOutputSchema},
  prompt: `You are an expert social media manager specializing in creating viral, engaging recruitment posts for LinkedIn.
Your task is to transform a standard job description into a short, punchy, and exciting post that makes top talent stop scrolling and want to apply.

**Instructions:**
1.  **Hook:** Start with a strong, attention-grabbing question or statement. Use an emoji.
2.  **Core Message:** Keep it concise. Summarize the role's impact and the most exciting aspect of the opportunity in 2-3 energetic sentences. Avoid corporate jargon.
3.  **Call to Action (CTA):** End with a clear, enthusiastic CTA and ask a question to drive engagement.
4.  **Hashtags:** Include 3-5 relevant, popular hashtags.
5.  **Formatting:** The output **MUST** use markdown for formatting (e.g., **bolding**, bullet points).

---
Job Description:
\`\`\`
{{{jobDescription}}}
\`\`\`
`,
});

const generateLinkedInPostFlow = ai.defineFlow(
  {
    name: 'generateLinkedInPostFlow',
    inputSchema: GenerateLinkedInPostInputSchema,
    outputSchema: GenerateLinkedInPostOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await generateLinkedInPostPrompt(input);
      
      if (!output) {
        throw new Error('The AI agent failed to generate a LinkedIn post.');
      }
      
      return output;

    } catch (error) {
      console.error('Error in generateLinkedInPostFlow:', error);
      // Re-throw a more user-friendly error to be caught by the client
      throw new Error(
        'The AI service is currently unavailable or encountered an error. Please try again later.'
      );
    }
  }
);
