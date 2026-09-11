import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

const router = Router();
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid country slug.");
const querySchema = z.object({
  search: z.string().trim().max(100).optional().default(""),
  continent: z.string().trim().max(40).optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional().default(12),
});
const countrySelect = {
  id: true, slug: true, name: true, officialName: true, cca2: true, cca3: true, capital: true, region: true,
  subregion: true, continent: true, flag: true, flagAlt: true, imageUrl: true, imageUrl2: true, facts: true, population: true, area: true,
  languages: true, currencies: true, timezones: true, summary: true,
} as const;

const withRating = async (country: any) => {
  const aggregate = await prisma.rating.aggregate({ where: { countryId: country.id }, _avg: { value: true }, _count: { _all: true } });
  return { ...country, ratingAverage: Number((aggregate._avg.value || 0).toFixed(1)), ratingCount: aggregate._count._all };
};

router.get("/", async (request, response, next) => {
  try {
    const query = querySchema.parse(request.query);
    const where = {
      ...(query.continent ? { continent: { equals: query.continent, mode: "insensitive" as const } } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search, mode: "insensitive" as const } }, { capital: { contains: query.search, mode: "insensitive" as const } }, { region: { contains: query.search, mode: "insensitive" as const } }] } : {}),
    };
    const [countries, total] = await Promise.all([
      prisma.country.findMany({ where, select: { ...countrySelect, _count: { select: { comments: true } } }, orderBy: { name: "asc" }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      prisma.country.count({ where }),
    ]);
    const enriched = await Promise.all(countries.map((country: any) => withRating({ ...country, commentCount: country._count.comments, _count: undefined })));
    response.json({ countries: enriched, total, page: query.page, pages: Math.max(1, Math.ceil(total / query.pageSize)) });
  } catch (error) { next(error); }
});

router.get("/:slug", async (request, response, next) => {
  try {
    const slug = slugSchema.parse(request.params.slug);
    const country = await prisma.country.findUnique({ where: { slug }, select: countrySelect });
    if (!country) return response.status(404).json({ error: "Country not found." });
    response.json({ country: await withRating(country) });
  } catch (error) { next(error); }
});

export default router;
