import type { z } from "zod";

export const formatZodError = (err: z.ZodError): string =>
  err.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");
