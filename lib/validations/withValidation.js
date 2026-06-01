import { validateRequest } from "./validateRequest";

export function withValidation(schema, handler, options = {}) {
  return async (req, context) => {
    const validation = await validateRequest(req, schema, options.maxBytes);

    if (!validation.success) {
      return validation.response;
    }

    return handler(req, validation.data, context);
  };
}
