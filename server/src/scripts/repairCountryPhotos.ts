import { prisma } from "../prisma";

type SourceCountry = {
  cca3?: string;
  name: { common: string };
  latlng?: number[];
};

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{ thumburl?: string; mime?: string }>;
};

const isGeneric = (url: string | null) => !url || url.includes("images.unsplash.com");
const isBadPhoto = (url: string | null) => !url || /ISS|STS|view[_ -]?of[_ -]?earth|satellite|MODIS|astronaut|flag|map|logo|coat|symbol|outline|diagram|chart|painting|art[_ -]?project|stamp|pdf|webm/i.test(url);
const rejectedTitle = /flag|map|coat of arms|logo|symbol|outline|blank|emblem|ISS|STS|earth|satellite|MODIS|astronaut|painting|art project|stamp|pdf|webm/i;

async function findCommonsImages(country: SourceCountry, used: Set<string>) {
  const coordinate = country.latlng?.length === 2 ? `${country.latlng[0]}|${country.latlng[1]}` : null;
  const queries = [
    ...(coordinate ? [{ generator: "geosearch", ggscoord: coordinate, ggsradius: "100000", ggsnamespace: "6", ggslimit: "50" }] : []),
    ...["landscape", "nature", "city"].map((term) => ({ generator: "search", gsrsearch: `${country.name.common} ${term}`, gsrnamespace: "6", gsrlimit: "20" })),
  ];

  for (const query of queries) {
    const params = new URLSearchParams({
      action: "query",
      ...query,
      prop: "imageinfo",
      iiprop: "url|mime",
      iiurlwidth: "1280",
      format: "json",
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
          headers: { "User-Agent": "GeoFacts/1.0 (country photo repair; educational project)" },
        });
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
        continue;
      }
      if (response.ok) {
        const payload = await response.json() as { query?: { pages?: Record<string, CommonsPage> } };
        const urls = Object.values(payload.query?.pages || {})
          .filter((page) => page.imageinfo?.[0]?.mime?.startsWith("image/") && !rejectedTitle.test(page.title || ""))
          .map((page) => page.imageinfo?.[0]?.thumburl)
          .filter((url): url is string => typeof url === "string" && !used.has(url));
        if (urls.length >= 2) return [urls[0], urls[1]] as const;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 3000 * (attempt + 1)));
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  return null;
}

async function main() {
  const sourceResponse = await fetch("https://raw.githubusercontent.com/mledoze/countries/master/countries.json");
  if (!sourceResponse.ok) throw new Error(`Country source returned ${sourceResponse.status}`);
  const sourceCountries = await sourceResponse.json() as SourceCountry[];
  const byCca3 = new Map(sourceCountries.map((country) => [country.cca3, country]));
  const countries = await prisma.country.findMany({ select: { id: true, cca3: true, name: true, imageUrl: true, imageUrl2: true } });
  const used = new Set(countries.flatMap((country) => [country.imageUrl, country.imageUrl2]).filter((url): url is string => Boolean(url) && !isGeneric(url)));
  let repaired = 0;

  const pending = countries.filter((item) => isBadPhoto(item.imageUrl) || isBadPhoto(item.imageUrl2));
  for (let index = 0; index < pending.length; index += 4) {
    const batch = pending.slice(index, index + 4);
    const results = await Promise.all(batch.map(async (country) => ({
      country,
      images: await findCommonsImages(byCca3.get(country.cca3)!, used),
    })));
    for (const { country, images } of results) {
      if (!images) {
        console.warn(`No verified Commons pair found for ${country.name}`);
        continue;
      }
      await prisma.country.update({ where: { id: country.id }, data: { imageUrl: images[0], imageUrl2: images[1] } });
      used.add(images[0]);
      used.add(images[1]);
      repaired += 1;
      console.log(`Repaired ${country.name}`);
    }
  }
  console.log(`Repaired ${repaired} countries.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
