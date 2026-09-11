import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) return response.status(400).json({ error: "Please check the submitted details.", details: error.issues.map((issue) => issue.path.join(".")).filter(Boolean) });
  console.error("Unhandled request error", { method: request.method, path: request.path, name: error instanceof Error ? error.name : "UnknownError" });
  response.status(500).json({ error: "Something went wrong on our end." });
};
