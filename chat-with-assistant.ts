'use server';

/**
 * @fileOverview This file defines a Genkit flow for a conversational AI assistant.
 *
 * - chatWithAssistant - The main function to start or continue a conversation with the assistant.
 * - ChatWithAssistantInput - The input type for the chatWithAssistant function.
 * - ChatWithAssistantOutput - The return type for the chatWithAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithAssistantInputSchema = z.object({
  message: z.string().describe('The user message to the assistant.'),
  conversationHistory: z
    .array(z.object({role: z.enum(['user', 'assistant']), content: z.string()}))
    .optional()
    .describe('The history of the conversation.'),
});
export type ChatWithAssistantInput = z.infer<typeof ChatWithAssistantInputSchema>;

const ChatWithAssistantOutputSchema = z.object({
  response: z.string().describe('The assistant response to the user message.'),
});
export type ChatWithAssistantOutput = z.infer<typeof ChatWithAssistantOutputSchema>;

export async function chatWithAssistant(input: ChatWithAssistantInput): Promise<ChatWithAssistantOutput> {
  return chatWithAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithAssistantPrompt',
  input: {schema: ChatWithAssistantInputSchema},
  output: {schema: ChatWithAssistantOutputSchema},
  prompt: `You are a helpful AI assistant. Your goal is to assist the user with their questions and tasks.

{% if conversationHistory %}
Here is the conversation history:
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}
{% endif %}

user: {{{message}}}
assistant: `,
});

const chatWithAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAssistantFlow',
    inputSchema: ChatWithAssistantInputSchema,
    outputSchema: ChatWithAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
