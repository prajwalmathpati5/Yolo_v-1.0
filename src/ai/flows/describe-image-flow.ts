
'use server';
/**
 * @fileOverview An AI flow to describe the contents of an image or extract text from it using Gemini's vision capabilities.
 *
 * - describeImage - A function that analyzes an image and returns a text description or extracted text.
 * - DescribeImageInput - The input type for the describeImage function.
 * - DescribeImageOutput - The return type for the describeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribeImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the item or situation, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeImageInput = z.infer<typeof DescribeImageInputSchema>;

const DescribeImageOutputSchema = z.object({
  description: z.string().describe("A detailed description of the problem or need shown in the image, or the text extracted from it."),
});
export type DescribeImageOutput = z.infer<typeof DescribeImageOutputSchema>;


export async function describeImage(input: DescribeImageInput): Promise<DescribeImageOutput> {
  return describeImageFlow(input);
}

const describeImagePrompt = ai.definePrompt({
  name: 'describeImagePrompt',
  model: 'googleai/gemini-1.5-flash-latest', // Explicitly use a vision-capable model
  input: {schema: DescribeImageInputSchema},
  output: {schema: DescribeImageOutputSchema},
  prompt: `You are an expert AI assistant with two primary skills: analyzing images to identify problems and extracting text from images. Your goal is to provide the most useful text description for the user's "need" box based on the uploaded image.

**Analyze the image and follow these rules:**
1.  **Check for Text:** First, determine if the image primarily contains text. This could be a picture of a document, a screenshot of notes, or handwritten text.
2.  **If Text is Present:** Accurately extract all the text from the image. The output should be only the extracted text.
3.  **If No Text is Present:** Analyze the image to identify a problem or need. Describe the situation concisely. For example:
    - If you see a leaking pipe, describe it as "Leaking pipe under the sink."
    - If you see a car with a flat tire, describe it as "A car with a flat tire."
    - If the image is unclear or doesn't show a clear problem, describe what you see, e.g., "A person smiling."

Your response will directly populate a text field for the user, so ensure it is either the full extracted text or a concise description.

Image: {{media url=imageDataUri}}
`,
});

const describeImageFlow = ai.defineFlow(
  {
    name: 'describeImageFlow',
    inputSchema: DescribeImageInputSchema,
    outputSchema: DescribeImageOutputSchema,
  },
  async (input) => {
    try {
        const {output} = await describeImagePrompt(input);
        if (!output) {
            throw new Error("AI failed to generate a description.");
        }
        return output;
    } catch (error) {
        console.error("Error in describeImageFlow:", error);
        // Re-throw a more user-friendly error to be caught by the client
        throw new Error("The AI service is currently unavailable or encountered an error. Please try again later.");
    }
  }
);
