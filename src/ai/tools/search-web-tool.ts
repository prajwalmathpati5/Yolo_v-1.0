
'use server';
/**
 * @fileOverview A tool to perform a web search using SerpApi and summarize the results with AI.
 * To make this tool functional, you must:
 * 1. Sign up for an API key at https://serpapi.com/
 * 2. Add your API key to the .env file as `SERP_API_KEY="your_key_here"`
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WebSearchResultSchema = z.object({
    answer: z.string().describe("A comprehensive, helpful, and conversational answer synthesized from the web search results. This should be formatted in clear markdown."),
    links: z.array(z.object({
        title: z.string(),
        link: z.string(),
    })).describe("A list of the most relevant source links found during the search."),
});

export const searchWebForExperts = ai.defineTool(
  {
    name: 'searchWebForExperts',
    description: 'Searches the web for information, guides, or solutions related to a user\'s query. Use this for research, planning (e.g., travel), or finding external information.',
    inputSchema: z.object({
      query: z.string().describe('A concise and effective search query to find relevant information on the web.'),
    }),
    outputSchema: WebSearchResultSchema,
  },
  async (input) => {
    const SERP_API_KEY = process.env.SERP_API_KEY;

    if (!SERP_API_KEY) {
      console.error("Missing SERP_API_KEY in environment variables. Please add it to your .env file.");
      return {
        answer: "The web search tool is not configured. Please ask the user to contact support and mention that the SERP_API_KEY is missing.",
        links: [],
      };
    }

    const searchUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(input.query)}&engine=google&api_key=${SERP_API_KEY}`;

    try {
      const response = await fetch(searchUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SerpApi request failed with status ${response.status}: ${errorText}`);
        return {
            answer: `Sorry, the web search failed with status: ${response.status}. I cannot complete the request right now.`,
            links: [],
        };
      }

      const data = await response.json();
      const results = data.organic_results || [];

      if (results.length === 0) {
        return {
            answer: "I couldn't find any relevant results on the web for that query. You could try rephrasing your request.",
            links: [],
        };
      }
      
      const snippets = results.slice(0, 5).map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      const summaryPrompt = `
        You are a research assistant. Based on the following web search results for the query "${input.query}", synthesize a helpful, conversational answer for the user.
        Format your response in clear markdown. If you find useful links, include them in your answer. Do not just list the results; provide a cohesive summary.
        Also provide a list of the source links you used.

        Search Results:
        ${JSON.stringify(snippets, null, 2)}
      `;

      const { output } = await ai.generate({
          prompt: summaryPrompt,
          model: 'googleai/gemini-1.5-flash-latest',
          output: {
              schema: WebSearchResultSchema,
          }
      });
      
      if (!output) {
        return {
            answer: "I found some results, but I had trouble summarizing them.",
            links: snippets.map(s => ({ title: s.title, link: s.link })),
        }
      }

      return output;

    } catch (error) {
      console.error("Error fetching or processing search results:", error);
      return {
          answer: "I encountered an unexpected error while trying to search the web. Please try again later.",
          links: [],
      };
    }
  }
);
