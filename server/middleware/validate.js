// Zod validation middleware (PDD §4 / §8). Validates and *replaces* the chosen
// request segment with the parsed/coerced value, so controllers receive clean,
// typed input. Returns 400 with a flattened error map on failure.
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: result.error.flatten(),
    });
  }
  req[source] = result.data;
  next();
};

module.exports = { validate };
