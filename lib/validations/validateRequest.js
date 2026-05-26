import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function validateRequest(req, schema) {
  try {
    const body = await req.json();

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
            details: error.flatten(),
          },
          { status: 400 }
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