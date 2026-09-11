import rateLimit from "express-rate-limit";
import type { Request } from "express";
import crypto from "node:crypto";
import { config } from "../config";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
export function verifyRequestOrigin(request: Request, response: import("express").Response, next: import("express").NextFunction) {
  if (!unsafeMethods.has(request.method)) return next();
  const source = request.get("origin") || request.get("referer");
  if (!source) return response.status(403).json({ error: "A trusted request origin is required." });
  try {
    if (new URL(source).origin !== config.clientOrigin) return response.status(403).json({ error: "A trusted request origin is required." });
  } catch {
    return response.status(403).json({ error: "A trusted request origin is required." });
  }
  next();
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: (request) => request.path === "/api/health",
  message: { error: "Too many requests. Please try again shortly." },
});
export const commentLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 12, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Please wait before posting another comment." } });
export const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many sign-in attempts. Please try again later." } });
export const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: "draft-8", legacyHeaders: false, message: { error: "Too many registration attempts. Please try again later." } });
export const fingerprint = (request: Request) => crypto.createHash("sha256").update(`${request.ip}|${request.headers["user-agent"] || ""}`).digest("hex");

const failedLoginAttempts = new Map<string, { count: number; resetAt: number }>();
const failedLoginWindowMs = 15 * 60 * 1000;
const failedLoginLimit = 5;

const loginAttemptKey = (request: Request, email: string) => `${request.ip}:${email.toLowerCase()}`;

export const isLoginBlocked = (request: Request, email: string) => {
  const attempt = failedLoginAttempts.get(loginAttemptKey(request, email));
  if (!attempt || attempt.resetAt <= Date.now()) {
    if (attempt) failedLoginAttempts.delete(loginAttemptKey(request, email));
    return false;
  }
  return attempt.count >= failedLoginLimit;
};

export const recordFailedLogin = (request: Request, email: string) => {
  const key = loginAttemptKey(request, email);
  const now = Date.now();
  const current = failedLoginAttempts.get(key);
  const attempt = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + failedLoginWindowMs }
    : { count: current.count + 1, resetAt: current.resetAt };
  failedLoginAttempts.set(key, attempt);
  return attempt.count;
};

export const clearFailedLogins = (request: Request, email: string) => {
  failedLoginAttempts.delete(loginAttemptKey(request, email));
};
