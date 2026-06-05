import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { parseJSON } from "@/lib/error-handler";

export async function validateRequest(req, schema, maxBytes = 1024 * 100) {
  try {
    const body = await parseJSON(req, maxBytes);

    const validatedData = schema.parse(body);

    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Validation failed",
            details: error.errors.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            })),
          },
          { status: 422 }
        ),
      };
    }

    if (error.statusCode) {
      return {
        success: false,
        response: NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: error.statusCode }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
        },
        { status: 400 }
      ),
    };
  }
}
