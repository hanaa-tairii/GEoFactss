import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../prisma";

type Claims = { sub: string; sv: number };
const tokenFromRequest = (request: Request) => request.cookies?.[config.cookieName] || (request.headers.authorization?.startsWith("Bearer ") ? request.headers.authorization.slice(7) : undefined);

export async function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const token = tokenFromRequest(request);
  if (token) {
    try {
      const claims = jwt.verify(token, config.jwtSecret) as Partial<Claims>;
      if (!claims.sub || typeof claims.sv !== "number") return next();
      const user = await prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true, name: true, email: true, sessionVersion: true } });
      if (user && user.sessionVersion === claims.sv) {
        const { sessionVersion: _sessionVersion, ...publicUser } = user;
        request.user = publicUser;
      }
    } catch { /* An expired optional token is equivalent to an anonymous request. */ }
  }
  next();
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  if (!request.user) return response.status(401).json({ error: "Please sign in to continue." });
  next();
}

export const issueToken = (userId: string, sessionVersion: number) => jwt.sign({ sub: userId, sv: sessionVersion } satisfies Claims, config.jwtSecret, { expiresIn: "7d" });
