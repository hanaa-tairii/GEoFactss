import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";
import { commentLimiter, fingerprint } from "../middleware/security";

const router = Router();
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid country slug.");
const commentSchema = z.object({ displayName: z.string().trim().min(1).max(60).optional(), body: z.string().trim().min(3).max(1000) });
const ratingSchema = z.object({ value: z.coerce.number().int().min(1).max(5) });

router.get("/:slug/comments", async (request, response, next) => {
  try {
    const country = await prisma.country.findUnique({ where: { slug: slugSchema.parse(request.params.slug) }, select: { id: true } });
    if (!country) return response.status(404).json({ error: "Country not found." });
    const comments = await prisma.comment.findMany({ where: { countryId: country.id }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, displayName: true, body: true, createdAt: true, user: { select: { name: true } } } });
    response.json({ comments });
  } catch (error) { next(error); }
});

router.post("/:slug/comments", commentLimiter, async (request, response, next) => {
  try {
    const data = commentSchema.parse(request.body);
    const country = await prisma.country.findUnique({ where: { slug: slugSchema.parse(request.params.slug) }, select: { id: true } });
    if (!country) return response.status(404).json({ error: "Country not found." });
    const hashedIp = fingerprint(request);
    const recent = await prisma.comment.count({ where: { countryId: country.id, fingerprint: hashedIp, createdAt: { gt: new Date(Date.now() - 30 * 60 * 1000) } } });
    if (recent >= 3) return response.status(429).json({ error: "You have shared several recent notes. Please come back later." });
    const comment = await prisma.comment.create({ data: { countryId: country.id, displayName: data.displayName || "Anonymous traveller", body: data.body, fingerprint: hashedIp, userId: request.user?.id }, select: { id: true, displayName: true, body: true, createdAt: true, user: { select: { name: true } } } });
    response.status(201).json({ comment });
  } catch (error) { next(error); }
});

router.post("/:slug/ratings", requireAuth, async (request, response, next) => {
  try {
    const data = ratingSchema.parse(request.body);
    const country = await prisma.country.findUnique({ where: { slug: slugSchema.parse(request.params.slug) }, select: { id: true } });
    if (!country) return response.status(404).json({ error: "Country not found." });
    await prisma.rating.upsert({ where: { userId_countryId: { userId: request.user!.id, countryId: country.id } }, create: { userId: request.user!.id, countryId: country.id, value: data.value }, update: { value: data.value } });
    const aggregate = await prisma.rating.aggregate({ where: { countryId: country.id }, _avg: { value: true }, _count: { _all: true } });
    response.json({ average: Number((aggregate._avg.value || 0).toFixed(1)), count: aggregate._count._all });
  } catch (error) { next(error); }
});
export default router;
