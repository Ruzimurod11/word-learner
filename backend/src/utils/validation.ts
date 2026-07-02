import type { z } from "zod";

export const formatZodError = (err: z.ZodError): string =>
  err.issues.map((i) => `${i.path.join(".") || "value"}: ${i.message}`).join("; ");

export const isUniqueViolation = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  if (/unique/i.test(err.message)) return true;
  const cause = (err as Error & { cause?: { code?: string } }).cause;
  return cause?.code === "23505";
};
