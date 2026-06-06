import { ZodError } from "zod";
import { parseJSON } from "@/lib/error-handler";
import { ValidationError } from "@/lib/errors";

export async function validateOrThrow(request, schema, maxBytes) {
  const body = await parseJSON(request, maxBytes);

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError({
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: error.errors.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    throw new ValidationError("Invalid request payload");
  }
}
