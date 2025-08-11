
'use server';
/**
 * @fileOverview An AI flow to analyze a document and identify the professional roles required for a project.
 *
 * - analyzeDocumentForRoles - A function that analyzes document text and returns a list of roles.
 * - AnalyzeDocumentForRolesInput - The input type for the function.
 * - AnalyzeDocumentForRolesOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentForRolesInputSchema = z.object({
  documentText: z
    .string()
    .describe(
      "The text content extracted from a user-uploaded document (e.g., a project brief, requirements summary)."
    ),
});
export type AnalyzeDocumentForRolesInput = z.infer<typeof AnalyzeDocumentForRolesInputSchema>;

const AnalyzeDocumentForRolesOutputSchema = z.object({
  rolesDescription: z.string().describe("A concise, descriptive summary of the professional roles needed for the project, suitable for a text input. E.g., 'Looking for a Frontend Developer, a Backend Developer, and a UI/UX Designer.'"),
});
export type AnalyzeDocumentForRolesOutput = z.infer<typeof AnalyzeDocumentForRolesOutputSchema>;


export async function analyzeDocumentForRoles(input: AnalyzeDocumentForRolesInput): Promise<AnalyzeDocumentForRolesOutput> {
  return analyzeDocumentForRolesFlow(input);
}

const analyzeDocumentForRolesPrompt = ai.definePrompt({
  name: 'analyzeDocumentForRolesPrompt',
  input: {schema: AnalyzeDocumentForRolesInputSchema},
  output: {schema: AnalyzeDocumentForRolesOutputSchema},
  prompt: `You are an expert project manager and technical recruiter. Your task is to read the following project document and identify the key professional roles required to complete the project.

Based on the document, formulate a concise, single-line description of the roles needed. This description will be used to populate a search box, so it should be clear and direct.

For example, if the document describes building a web application, your output should be something like: "Need a Frontend Developer, a Backend Developer, and a UI/UX Designer for a web app project."

If it describes a marketing campaign, you might say: "Looking for a Social Media Manager and a Graphic Designer."

Analyze the document below and provide the roles description.

Project Document:
\`\`\`
{{{documentText}}}
\`\`\`
`,
});

const analyzeDocumentForRolesFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentForRolesFlow',
    inputSchema: AnalyzeDocumentForRolesInputSchema,
    outputSchema: AnalyzeDocumentForRolesOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await analyzeDocumentForRolesPrompt(input);
        if (!output) {
            throw new Error("AI failed to generate a role description.");
        }
        return output;
    } catch (error) {
        console.error("Error in analyzeDocumentForRolesFlow:", error);
        throw new Error("The AI service could not analyze the document. Please try again later.");
    }
  }
);
