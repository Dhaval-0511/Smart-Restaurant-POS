import { errorResponse } from '../utils/response.util.js';

export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      const firstErrorMessage = error.errors?.[0]?.message || 'Validation failed';
      return errorResponse(res, firstErrorMessage, 400, {
        message: firstErrorMessage,
      });
    }
  };
};
