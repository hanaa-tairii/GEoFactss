import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { issueToken } from "../middleware/auth";
import { config } from "../config";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "../middleware/security";

const router = Router();
const credentials = z.object({ email: z.string().trim().email().max(160), password: z.string().min(8).max(100) });
const registerSchema = credentials.extend({ name: z.string().trim().min(2).max(60) });
const publicUser = (user: { id: string; name: string; email: string }) => ({ id: user.id, name: user.name, email: user.email });
const sendSession = (response: any, user: { id: string; name: string; email: string; sessionVersion: number }) => {
  response.cookie(config.cookieName, issueToken(user.id, user.sessionVersion), { httpOnly: true, sameSite: "lax", secure: config.isProduction, maxAge: 7 * 24 * 60 * 60 * 1000, path: "/" });
  response.json({ user: publicUser(user) });
};

router.post("/register", async (request, response, next) => {
  try {
    const data = registerSchema.parse(request.body);
    const email = data.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return response.status(409).json({ error: "An account with that email already exists." });
    const user = await prisma.user.create({ data: { name: data.name, email, passwordHash: await bcrypt.hash(data.password, 12) }, select: { id: true, name: true, email: true, sessionVersion: true } });
    sendSession(response, user);
  } catch (error) { next(error); }
});

router.post("/login", async (request, response, next) => {
  try {
    const data = credentials.parse(request.body);
    const email = data.email.toLowerCase();
    if (isLoginBlocked(request, email)) return response.status(429).json({ error: "Too many unsuccessful sign-in attempts. Please try again in 15 minutes." });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, passwordHash: true, sessionVersion: true } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
      const attempts = recordFailedLogin(request, email);
      if (attempts >= 5) return response.status(429).json({ error: "Too many unsuccessful sign-in attempts. Please try again in 15 minutes." });
      return response.status(401).json({ error: "Email or password is incorrect." });
    }
    clearFailedLogins(request, email);
    sendSession(response, user);
  } catch (error) { next(error); }
});

router.post("/logout", async (request, response, next) => {
  try {
    if (request.user) await prisma.user.update({ where: { id: request.user.id }, data: { sessionVersion: { increment: 1 } } });
    response.clearCookie(config.cookieName, { httpOnly: true, sameSite: "lax", secure: config.isProduction, path: "/" });
    response.json({ ok: true });
  } catch (error) { next(error); }
});
router.get("/me", (request, response) => response.json({ user: request.user ? publicUser(request.user) : null }));
export default router;
