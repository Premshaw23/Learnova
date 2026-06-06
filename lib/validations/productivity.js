import { z } from "zod";

const MAX_ITEMS = 500;
const MAX_AGENDA_DAYS = 60;

export const sessionSchema = z.object({
  duration: z
    .number({ message: "duration must be a number" })
    .int("duration must be an integer")
    .min(1, "duration must be at least 1 minute")
    .max(480, "duration cannot exceed 8 hours"),
  type: z.enum(["focus", "break"], {
    message: "type must be either 'focus' or 'break'",
  }),
});

const taskSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string().min(1),
  done: z.boolean(),
  priority: z.string().optional(),
  createdAt: z.string().optional(),
});

const agendaItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  text: z.string().min(1),
  label: z.string().optional(),
  time: z.string().optional(),
  timeMinutes: z.number().optional(),
});

export const productivityPostSchema = z.object({
  tasks: z
    .array(taskSchema)
    .max(MAX_ITEMS, `Tasks cannot exceed ${MAX_ITEMS} items`),
  agendaItems: z
    .record(
      z.string(),
      z
        .array(agendaItemSchema)
        .max(MAX_ITEMS, `Agenda items per day cannot exceed ${MAX_ITEMS}`)
    )
    .refine((record) => Object.keys(record).length <= MAX_AGENDA_DAYS, {
      message: `Cannot sync more than ${MAX_AGENDA_DAYS} days of agenda items`,
    }),
});
