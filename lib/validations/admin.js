import { z } from "zod";

export const parentStudentLinkSchema = z.object({
  parentEmail: z.string().email("Invalid parent email"),
  studentEmail: z.string().email("Invalid student email"),
});

export const deleteParentStudentLinkSchema = z.object({
  parentId: z.string().min(1, "parentId is required"),
  studentId: z.string().min(1, "studentId is required"),
});
