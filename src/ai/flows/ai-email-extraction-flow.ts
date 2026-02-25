'use server';
/**
 * @fileOverview This file contains a Genkit flow for intelligently extracting
 * unique and valid email addresses from a given text block.
 *
 * - extractEmails: A function to initiate the email extraction process.
 * - AiEmailExtractionInput: The input type for the extractEmails function.
 * - AiEmailExtractionOutput: The return type for the extractEmails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiEmailExtractionInputSchema = z.object({
  text: z.string().describe('The text block from which to extract email addresses.'),
});
export type AiEmailExtractionInput = z.infer<typeof AiEmailExtractionInputSchema>;

const AiEmailExtractionOutputSchema = z.object({
  emails: z
    .array(z.string().email().describe('A valid email address.'))
    .describe('An array of unique, valid email addresses extracted from the text.'),
});
export type AiEmailExtractionOutput = z.infer<typeof AiEmailExtractionOutputSchema>;

export async function extractEmails(input: AiEmailExtractionInput): Promise<AiEmailExtractionOutput> {
  return aiEmailExtractionFlow(input);
}

const aiEmailExtractionPrompt = ai.definePrompt({
  name: 'aiEmailExtractionPrompt',
  input: {schema: AiEmailExtractionInputSchema},
  output: {schema: AiEmailExtractionOutputSchema},
  prompt: `You are an expert at identifying and extracting unique email addresses from text.
Your task is to analyze the provided text and return all unique and valid email addresses found.
Ensure that the output contains only unique and correctly formatted email addresses.

Text to analyze: {{{text}}}`, 
});

const aiEmailExtractionFlow = ai.defineFlow(
  {
    name: 'aiEmailExtractionFlow',
    inputSchema: AiEmailExtractionInputSchema,
    outputSchema: AiEmailExtractionOutputSchema,
  },
  async (input) => {
    const {output} = await aiEmailExtractionPrompt(input);
    if (!output) {
      throw new Error('Failed to extract emails: AI returned no output.');
    }
    return output;
  },
);
