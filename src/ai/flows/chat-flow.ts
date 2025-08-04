
'use server';
/**
 * @fileOverview An AI-powered chat support flow.
 *
 * - chat - A function that generates a response from the AI support agent.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Message, ServiceProvider } from '@/lib/types';
import { findProvidersForProject } from '../tools/find-providers-tool';

// Define a specific schema for a single message in the history
const ChatMessageSchema = z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The conversation history.'),
  newMessage: z.string().describe('The latest message from the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
    response: z.string().describe("The AI support agent's response."),
    matchedProviders: z.array(z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        phone_number: z.string(),
        avg_cost: z.number(),
        available: z.boolean(),
    })).optional().describe('An optional list of service providers that match the user\'s query.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;


export async function chat(input: { history: Message[], newMessage: string }): Promise<ChatOutput> {
    const genkitHistory = input.history.map(msg => ({
        // 'model' is the AI, 'user' is the human
        role: msg.isCurrentUser ? 'user' : 'model' as const,
        content: msg.text,
    }));

    // The prompt will get the latest message separately.
    const flowInput = {
        history: genkitHistory,
        newMessage: input.newMessage
    };

    return chatFlow(flowInput);
}

const prompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  tools: [findProvidersForProject],
  prompt: `You are "YOLO Needs AI", a friendly, knowledgeable, and versatile assistant, like ChatGPT, for an app called "YOLO Needs". Your goal is to be as helpful as possible to the user.

Your capabilities include:
1.  **General Conversation & Q&A:** Engage in natural conversation. Answer general knowledge questions, provide explanations, give advice, or help with creative tasks. Be helpful and conversational.
2.  **Finding Service Providers:** If a user explicitly asks for help with a task that requires a professional (e.g., "my sink is leaking," "I need a mover," "find me a web developer"), use the 'findProvidersForProject' tool to locate suitable professionals from the app's network. Make a best-effort guess for the category and use the tool.
3.  **App Support:** Answer questions about how the "YOLO Needs" app works.

Unless the user's request clearly requires finding a service provider, you should aim to answer their question directly.

This is the conversation history so far:
{{#each history}}
{{role}}: {{content}}
{{/each}}
user: {{{newMessage}}}
model:
`,
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    try {
        const llmResponse = await prompt(input);
        
        const toolExecution = llmResponse.toolExecutions[0];

        // Check if a tool was successfully called and executed
        if (toolExecution && toolExecution.name === 'findProvidersForProject') {
            const providers = toolExecution.output as ServiceProvider[];
            if (providers && providers.length > 0) {
                return {
                    response: "I found some professionals who might be a good fit for your project. Here are their details:",
                    matchedProviders: providers,
                };
            } else {
                return {
                    response: "I looked, but I couldn't find any available providers for that category right now. You can try submitting your need through the 'Capture Need' page, and we'll notify you when someone becomes available.",
                };
            }
        }
        
        // If no tool was called, or if it failed, fall back to the model's text response.
        const output = llmResponse.output;
        if (!output) {
            throw new Error("Flow failed to produce a valid output.");
        }
        
        return {
          response: output.response,
        };

    } catch (error) {
        console.error("Error in chatFlow:", error);
        return {
            response: "Sorry, I'm having trouble connecting to the AI service right now. Please try again in a few moments.",
        };
    }
  }
);
