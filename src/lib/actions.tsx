"use server";

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function continueConversation(history: Message[]) {
  "use server";

  const { text, toolResults } = await generateText({
    model: groq("llama-3.2-3b-preview"),
    system: "You are a friendly assistant!",
    messages: history,
    tools: {
      celsiusToFahrenheit: {
        description: "Converts celsius to fahrenheit",
        parameters: z.object({
          value: z.string().describe("The value in celsius"),
        }),
        execute: async ({ value }) => {
          const celsius = parseFloat(value);
          const fahrenheit = celsius * (9 / 5) + 32;
          return `${celsius}°C is ${fahrenheit.toFixed(2)}°F`;
        },
      },
      whatIsLove: {
        description: "What is love?",
        parameters: z.object({
          text: z.string().describe("The text to search for"),
        }),
        execute: async ({}) => {
          return `Baby don't hurt me, No more!"`;
        },
      },
      bestBeer: {
        description: "the best beer",
        parameters: z.object({
          text: z.string().describe("The text to search for"),
        }),
        execute: async ({}) => {
          return `Guiness is the best beer. Heineken is a close second though`;
        },
      },
    },
  });

  return {
    messages: [
      ...history,
      {
        role: "assistant" as const,
        content:
          text || toolResults.map((toolResult) => toolResult.result).join("\n"),
      },
    ],
  };
}
