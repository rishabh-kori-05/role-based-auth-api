import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Generic Zod validation middleware.
 * Schema should have { body?, params?, query? } keys.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Write parsed (transformed) values back so controllers get clean data
      req.body   = parsed.body   ?? req.body;
      req.params = parsed.params ?? req.params;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.slice(1).join('.'), // strip leading 'body'/'params'
          message: e.message,
        }));
        res.status(422).json({ status: 'error', errors });
        return;
      }
      next(err);
    }
  };
