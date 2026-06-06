import { z } from "zod";

export const conversationSchema = z
  .object({
    userMessage: z
      .string()
      .min(1, "User message is required")
      .max(10000, "User message too long (max 10000 chars)"),
    botMessage: z
      .string()
      .min(1, "Bot message is required")
      .max(10000, "Bot message too long (max 10000 chars)"),
  })
  .strict();
