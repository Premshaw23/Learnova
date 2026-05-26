import { validateRequest } from "./validateRequest";

export function withValidation(schema, handler) {
  return async (req, context) => {
    const validation = await validateRequest(req, schema);

    if (!validation.success) {
      return validation.response;
    }

    return handler(req, validation.data, context);
  };
}