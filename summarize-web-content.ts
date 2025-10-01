// Summarize Web Content Flow
'use server';
/**
 * @fileOverview A web content summarization AI agent.
 *
 * - summarizeWebContent - A function that handles the web content summarization process.
 * - SummarizeWebContentInput - The input type for the summarizeWebContent function.
 * - SummarizeWebContentOutput - The return type for the summarizeWebContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { extractContent } from '@/services/url-extractor';

const SummarizeWebContentInputSchema = z.object({
  url: z.string().url().describe('The URL of the web page to summarize.'),
});
export type SummarizeWebContentInput = z.infer<typeof SummarizeWebContentInputSchema>;

const SummarizeWebContentOutputSchema = z.object({
  summary: z.string().describe('The summary of the web page content.'),
});
export type SummarizeWebContentOutput = z.infer<typeof SummarizeWebContentOutputSchema>;

export async function summarizeWebContent(input: SummarizeWebContentInput): Promise<SummarizeWebContentOutput> {
  return summarizeWebContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWebContentPrompt',
  input: {schema: SummarizeWebContentInputSchema},
  output: {schema: SummarizeWebContentOutputSchema},
  prompt: `You are an expert summarizer.  You will be provided the content of a web page, and you will summarize it into a concise summary.

Web page content: {{{content}}}`,
});

const summarizeWebContentFlow = ai.defineFlow(
  {
    name: 'summarizeWebContentFlow',
    inputSchema: SummarizeWebContentInputSchema,
    outputSchema: SummarizeWebContentOutputSchema,
  },
  async input => {
    const content = await extractContent(input.url);
    const {output} = await prompt({content});
    return output!;
  }
);
