'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering questions about an image.
 *
 * - visualQuestionAnswer - The main function to trigger the flow.
 * - VisualQuestionAnswerInput - The input type for the function.
 * - VisualQuestionAnswerOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

const VisualQuestionAnswerInputSchema = z.object({
  question: z.string().describe('The question being asked about the image.'),
  photoDataUri: z
    .string()
    .describe(
      "A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VisualQuestionAnswerInput = z.infer<
  typeof VisualQuestionAnswerInputSchema
>;

const VisualQuestionAnswerOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the image.'),
});
export type VisualQuestionAnswerOutput = z.infer<
  typeof VisualQuestionAnswerOutputSchema
>;

export async function visualQuestionAnswer(
  input: VisualQuestionAnswerInput
): Promise<VisualQuestionAnswerOutput> {
  return visualQuestionAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'visualQuestionAnswerPrompt',
  input: { schema: VisualQuestionAnswerInputSchema },
  output: { schema: VisualQuestionAnswerOutputSchema },
  prompt: `Based on the provided image and question, provide a concise answer.

Question: {{{question}}}
Image: {{media url=photoDataUri}}`,
  model: googleAI.model('gemini-2.5-flash'),
});

const visualQuestionAnswerFlow = ai.defineFlow(
  {
    name: 'visualQuestionAnswerFlow',
    inputSchema: VisualQuestionAnswerInputSchema,
    outputSchema: VisualQuestionAnswerOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
