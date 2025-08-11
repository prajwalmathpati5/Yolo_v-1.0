
'use server';
/**
 * @fileOverview An AI flow to analyze a user's need and provide a direct, conversational solution,
 * much like a versatile chatbot.
 *
 * - analyzeNeed - A function that analyzes a description and image to generate a helpful solution.
 * - AnalyzeNeedInput - The input type for the analyzeNeed function.
 * - AnalyzeNeedOutput - The return type for the analyzeNeed function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findProvidersForProject } from '../tools/find-providers-tool';
import { searchWebForExperts } from '../tools/search-web-tool';
import { marked } from 'marked';


const AnalyzeNeedInputSchema = z.object({
  description: z.string().describe("The detailed description of the user's need, problem, or question. This might be empty if an image is provided."),
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo of the item or situation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeNeedInput = z.infer<typeof AnalyzeNeedInputSchema>;


const AnalyzeNeedOutputSchema = z.object({
  summary: z.string().describe("A concise, one or two-sentence summary of the proposed solution."),
  steps: z.array(z.object({
    title: z.string().describe("A short, clear title for this step."),
    description: z.string().describe("A detailed, user-friendly description of what to do in this step."),
  })).optional().describe("A list of actionable steps to resolve the need. Omit if the solution is a simple answer."),
  additionalInfo: z.string().optional().describe("Any extra tips, warnings, or helpful context. If a web search was performed, integrate the source links here in markdown format."),
});
export type AnalyzeNeedOutput = z.infer<typeof AnalyzeNeedOutputSchema>;


export async function analyzeNeed(input: AnalyzeNeedInput): Promise<AnalyzeNeedOutput> {
  const result = await analyzeNeedFlow(input);
  if (result.additionalInfo) {
      // Sanitize and convert markdown to HTML for safe rendering.
      result.additionalInfo = await marked.parse(result.additionalInfo, { gfm: true, breaks: true });
  }
  return result;
}

const analyzeNeedPrompt = ai.definePrompt({
  name: 'analyzeNeedPrompt',
  input: {schema: AnalyzeNeedInputSchema},
  output: {schema: AnalyzeNeedOutputSchema},
  tools: [findProvidersForProject, searchWebForExperts],
  prompt: `You are "YOLO Needs AI", an expert consultant and universal problem-solver. Your goal is to analyze a user's need and provide a clear, structured, and actionable solution.

1.  **Understand the User's Goal**: Read the user's description and analyze the image (if provided) to fully grasp what they want to achieve.
2.  **Use Your Tools (If Necessary)**:
    a.  If the problem could be solved by hiring a professional from our network (e.g., "my sink is leaking"), use 'findProvidersForProject' to see if there are matches.
    b.  If the problem requires external knowledge or research (e.g., "how do I plan a trip from Bengaluru to Bidar?"), use 'searchWebForExperts' to find relevant information.
3.  **Incorporate Tool Results**: After a tool is used, its output will be provided to you. You MUST integrate the information from the tool's output into your response. For example, if 'findProvidersForProject' returns a list of plumbers, mention them. If 'searchWebForExperts' returns an answer and links, summarize the answer and include the links in your 'additionalInfo' field.
4.  **Formulate a Structured Response**: Based on your analysis and tool results, generate a solution that populates the output schema:
    -   **summary**: Write a brief, high-level summary of the solution.
    -   **steps**: If the solution involves multiple actions, break it down into a clear, step-by-step plan. Each step should have a simple 'title' and a helpful 'description'. If it's a simple answer, you can omit this field.
    -   **additionalInfo**: Add any extra tips, context, or warnings here. If you used the 'searchWebForExperts' tool, you MUST include the source links from its output in markdown format (e.g., "[Article Title](https://example.com)") within this field.

Analyze the following user need and provide a structured, helpful answer:

User need description: {{{description}}}
{{#if imageDataUri}}
Photo of the need: {{media url=imageDataUri}}
{{/if}}
`,
});

const analyzeNeedFlow = ai.defineFlow(
  {
    name: 'analyzeNeedFlow',
    inputSchema: AnalyzeNeedInputSchema,
    outputSchema: AnalyzeNeedOutputSchema,
  },
  async (input) => {
    try {
        const response = await analyzeNeedPrompt(input);
        const solution = response.output;

        if (!solution) {
            throw new Error("AI failed to generate a solution.");
        }
        
        return solution;
    } catch (error) {
        console.error("Error in analyzeNeedFlow:", error);
        // Re-throw a more user-friendly error to be caught by the client
        throw new Error("The AI service is currently unavailable or encountered an error. Please try again later.");
    }
  }
);
