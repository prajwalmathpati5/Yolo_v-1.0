
'use server';
/**
 * @fileOverview An AI flow designed for conversational provider search.
 * It takes a user's need, finds providers, and formats a conversational response.
 *
 * - findProvidersInConversation - The main function for this flow.
 * - FindProvidersInConversationInput - The input schema.
 * - FindProvidersInConversationOutput - The output schema.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findProvidersForProject } from '../tools/find-providers-tool';
import type { ServiceProvider } from '@/lib/types';


const FindProvidersInConversationInputSchema = z.object({
  need: z.string().describe("The user's description of what they need help with."),
});
export type FindProvidersInConversationInput = z.infer<typeof FindProvidersInConversationInputSchema>;

const FindProvidersInConversationOutputSchema = z.object({
    response: z.string().describe("A friendly, conversational response summarizing the findings."),
    matchedProviders: z.array(z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        phone_number: z.string(),
        avg_cost: z.number(),
        available: z.boolean(),
    })).optional().describe('An optional list of service providers that match the user\'s query.'),
});
export type FindProvidersInConversationOutput = z.infer<typeof FindProvidersInConversationOutputSchema>;


export async function findProvidersInConversation(input: FindProvidersInConversationInput): Promise<FindProvidersInConversationOutput> {
    return findProvidersInConversationFlow(input);
}

const findProvidersPrompt = ai.definePrompt({
  name: 'findProvidersInConversationPrompt',
  input: { schema: FindProvidersInConversationInputSchema },
  output: { schema: FindProvidersInConversationOutputSchema },
  tools: [findProvidersForProject],
  prompt: `You are an AI assistant helping a user find a service provider. Your goal is to understand their need and use the 'findProvidersForProject' tool to see if any professionals in our network can help.

1.  **Analyze the Need**: Read the user's need: "{{{need}}}"
2.  **Determine the Category**: Identify the single most relevant service category from the user's need. For example, if the user says "my sink is clogged," the category is "Plumbing". If they say "I need to build a website," the category might be "Web Developer".
3.  **Call the Tool**: Use the 'findProvidersForProject' tool with the category you identified.
4.  **Formulate a Response**:
    *   If the tool returns one or more providers, your response should be something like: "I found a few professionals who might be able to help with that. Here are their details:"
    *   If the tool returns an empty list, your response should be: "I'm sorry, I couldn't find any available providers for that category right now. You could try rephrasing your need or creating a job post to find individual candidates."
`,
});

const findProvidersInConversationFlow = ai.defineFlow(
  {
    name: 'findProvidersInConversationFlow',
    inputSchema: FindProvidersInConversationInputSchema,
    outputSchema: FindProvidersInConversationOutputSchema,
  },
  async (input) => {
    const { output, toolExecutions } = await findProvidersPrompt(input);

        const toolExecution = toolExecutions?.find(
            (exec) => exec.name === 'findProvidersForProject'
        );

        const providers = (toolExecution?.output as ServiceProvider[] | undefined) || [];

        if (!output) {
            return {
                response: "I'm sorry, I wasn't able to find a specific provider for that. Could you try rephrasing your request?",
            };
        }

        return {
          response: output.response,
          matchedProviders: providers,
        };
 
    // No catch block here, let the error propagate up.
    // Genkit handles errors in flows by default, and we want to avoid
    // silently failing or returning a generic message if the prompt itself
    // fails to execute or return a valid output.
  }
);

    

    
