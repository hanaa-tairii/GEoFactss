import { prisma } from "../prisma";

type RestCountry = {
  cca2?: string; cca3?: string; name: { common: string; official: string }; capital?: string[]; region: string;
  subregion?: string; continents?: string[]; flags?: { png?: string; alt?: string };
  population?: number | null; area?: number; languages?: Record<string, string>;
  currencies?: Record<string, { name: string }>; timezones?: string[]; landlocked?: boolean; latlng?: number[];
  borders?: string[]; independent?: boolean; unMember?: boolean;
};
const slugify = (value: string) => value.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "-");

const fallbackPhotos = [
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1280&q=85",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=85",
];

const territoryPopulationOverrides: Record<string, number> = {
  "Åland Islands": 30500,
  "Caribbean Netherlands": 31000,
  "Cook Islands": 15000,
  Guadeloupe: 375000,
  "Christmas Island": 1800,
  Niue: 1600,
  Martinique: 350000,
  Mayotte: 310000,
  Réunion: 885000,
  Tokelau: 1500,
  "Saint Helena, Ascension and Tristan da Cunha": 5600,
  "Falkland Islands": 3800,
  Guernsey: 64000,
  Kosovo: 1660000,
  Taiwan: 23400000,
  "Wallis and Futuna": 11000,
  "Western Sahara": 600000,
  "Saint Barthélemy": 11000,
  Montserrat: 4400,
  Jersey: 104000,
  Anguilla: 15000,
  "Norfolk Island": 2200,
  "Saint Pierre and Miquelon": 5900,
  "Vatican City": 500,
  "Svalbard and Jan Mayen": 2900,
  "Cocos (Keeling) Islands": 600,
  "French Guiana": 300000,
  "Pitcairn Islands": 35,
};

const curatedCountryPhotos: Record<string, [string, string]> = {
  China: [
    "https://upload.wikimedia.org/wikipedia/commons/4/47/Zhangjiajie_National_Forest_Park.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/64/Great_Wall_of_China.jpg",
  ],
  "Christmas Island": [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Crab_migration_extra_-_chris_bray-1.jpg/960px-Crab_migration_extra_-_chris_bray-1.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b9/Christmas_Island_red_crab.jpg",
  ],
  Yemen: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Yemen_Landscape_%282885041604%29.jpg/1280px-Yemen_Landscape_%282885041604%29.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a7/Yemen_Landscape_-_1989.jpg/1280px-Yemen_Landscape_-_1989.jpg",
  ],
  "Vatican City": [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Basilica_Sancti_Petri_blue_hour.jpg/1280px-Basilica_Sancti_Petri_blue_hour.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg/1280px-Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg",
  ],
  Zambia: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/da/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg/1280px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_04.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2d/Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_05.jpg/1280px-Cataratas_Victoria%2C_Zambia-Zimbabue%2C_2018-07-27%2C_DD_05.jpg",
  ],
  "American Samoa": [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/%28Landscape_of_a_mountainside_in_Pago_Pago%2C_American_Samoa%29_-_DPLA_-_51a5463e1d1d9e8bb06633026ada9b97.jpg/1280px-%28Landscape_of_a_mountainside_in_Pago_Pago%2C_American_Samoa%29_-_DPLA_-_51a5463e1d1d9e8bb06633026ada9b97.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/%28Landscape_of_mountains_and_bay_in_Pago_Pago%2C_American_Samoa%29_-_DPLA_-_1ed39314430f1b8d9f42ed6b94817922.jpg/1280px-%28Landscape_of_mountains_and_bay_in_Pago_Pago%2C_American_Samoa%29_-_DPLA_-_1ed39314430f1b8d9f42ed6b94817922.jpg",
  ],
  Angola: [
    "https://upload.wikimedia.org/wikipedia/commons/d/dd/Angola_landscape.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/076_Baby_Angolan_giraffes_running_in_Etosha_National_Park_Photo_by_Giles_Laurent.jpg/1280px-076_Baby_Angolan_giraffes_running_in_Etosha_National_Park_Photo_by_Giles_Laurent.jpg",
  ],
  Aruba: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Aruba_Lava_Formation_ALF_Landscape_Undulating_Diabase_Hills_Arikok_National_Park_Santa_Cruz_Aruba.jpg/1280px-Aruba_Lava_Formation_ALF_Landscape_Undulating_Diabase_Hills_Arikok_National_Park_Santa_Cruz_Aruba.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Aruba_cacti_landscape_toward_ocean.jpg/1280px-Aruba_cacti_landscape_toward_ocean.jpg",
  ],
  Azerbaijan: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/2017_Summer_WikiCamp_Azerbaijan_Landscape_%28Oyuncu_Aykhan%29_02.jpg/1280px-2017_Summer_WikiCamp_Azerbaijan_Landscape_%28Oyuncu_Aykhan%29_02.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/2017_Summer_WikiCamp_Azerbaijan_Landscape_%28Oyuncu_Aykhan%29_06.jpg/1280px-2017_Summer_WikiCamp_Azerbaijan_Landscape_%28Oyuncu_Aykhan%29_06.jpg",
  ],
  Bahamas: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7a/Bahamas_1988_%28054%29_New_Providence_Cable_Beach_%2823365179346%29.jpg/1280px-Bahamas_1988_%28054%29_New_Providence_Cable_Beach_%2823365179346%29.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Amphitheatre_Nassau_Cruise_Port_Bahamas_2024.jpg/1280px-Amphitheatre_Nassau_Cruise_Port_Bahamas_2024.jpg",
  ],
  Bahrain: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/82/Manama_Bahrain_Bay_01.jpg/1280px-Manama_Bahrain_Bay_01.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Manama_Manama_Skyline_01.jpg/1280px-Manama_Manama_Skyline_01.jpg",
  ],
  Belarus: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/4547_Hamlet_rural_landscape_Belarus_May_2019.JPG/1280px-4547_Hamlet_rural_landscape_Belarus_May_2019.JPG",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Przewalski%27s_horses_at_sunset.png/1280px-Przewalski%27s_horses_at_sunset.png",
  ],
  Benin: [
    "https://upload.wikimedia.org/wikipedia/commons/3/39/Dans_la_Nature_au_B%C3%A9nin.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/39/Image_Nature_B%C3%A9nin_KIKI_Pascal.jpg/1280px-Image_Nature_B%C3%A9nin_KIKI_Pascal.jpg",
  ],
  Turkmenistan: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/Ashgabat%2C_Turkmenistan.jpg/1280px-Ashgabat%2C_Turkmenistan.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/The_Door_to_Hell_-_Turkmenistan%2C_Darvaza_-_panoramio.jpg",
  ],
  Bolivia: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Desierto_de_Dal%C3%AD%2C_Bolivia%2C_2016-02-02%2C_DD_107.JPG/1280px-Desierto_de_Dal%C3%AD%2C_Bolivia%2C_2016-02-02%2C_DD_107.JPG",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Desierto_de_Siloli%2C_Bolivia%2C_2016-02-03%2C_DD_09-14_PAN.JPG/1280px-Desierto_de_Siloli%2C_Bolivia%2C_2016-02-03%2C_DD_09-14_PAN.JPG",
  ],
  "Cayman Islands": [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/2010-04-14_Grand_Cayman_Cayman_Islands_-_Stingray.jpg/1280px-2010-04-14_Grand_Cayman_Cayman_Islands_-_Stingray.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/98/Cayman_Islands_-_Kaibo_Beach.jpg/1280px-Cayman_Islands_-_Kaibo_Beach.jpg",
  ],
  "Cape Verde": [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/17/A_dry_western_Boa_Vista_landscape%2C_Cape_Verde%2C_2010_December.jpg/1280px-A_dry_western_Boa_Vista_landscape%2C_Cape_Verde%2C_2010_December.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Cape_Verde_Fogo_landscape_1.jpg/1280px-Cape_Verde_Fogo_landscape_1.jpg",
  ],
  Nicaragua: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Nicaragua_volcan_Cosig%C3%BCina_5.jpg/1280px-Nicaragua_volcan_Cosig%C3%BCina_5.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/44/Edward_Gennys_Fanshawe%2C_The_extinct_volcanoes_Viejo_and_Monotomba%2C_Realejo_%28Nicaragua%29%2C_April_5th_1850.jpg",
  ],
  Morocco: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Arhbalou_High_Atlas_Al_Haouz_Morocco_Oct25_A7CR_08381.jpg/1280px-Arhbalou_High_Atlas_Al_Haouz_Morocco_Oct25_A7CR_08381.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d7/Camel_Tour_on_Erg_Chebbi_riding_across_the_dunes.jpg/1280px-Camel_Tour_on_Erg_Chebbi_riding_across_the_dunes.jpg",
  ],
  Sudan: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Children_sitting_by_roadside_rural_Sudan_landscape.jpg/1280px-Children_sitting_by_roadside_rural_Sudan_landscape.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/b/b3/Nubian_Desert_NASA.jpg",
  ],
  Paraguay: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/ASUNCION_PARAGUAY_PRIMAVERA.jpg/1280px-ASUNCION_PARAGUAY_PRIMAVERA.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/10/Asunci%C3%B3n_Paraguay_I.jpg/1280px-Asunci%C3%B3n_Paraguay_I.jpg",
  ],
  Afghanistan: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Cultural_Landscape_and_Archaeological_Remains_of_the_Bamiyan_Valley-109156.jpg/1280px-Cultural_Landscape_and_Archaeological_Remains_of_the_Bamiyan_Valley-109156.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cb/Cultural_Landscape_and_Archaeological_Remains_of_the_Bamiyan_Valley-109157.jpg/1280px-Cultural_Landscape_and_Archaeological_Remains_of_the_Bamiyan_Valley-109157.jpg",
  ],
  Eswatini: [
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Eswatini_landscape.jpg/1280px-Eswatini_landscape.jpg",
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/African_striped_skinks_%28Trachylepis_striata%29_Malolotja.jpg/1280px-African_striped_skinks_%28Trachylepis_striata%29_Malolotja.jpg",
  ],
};

async function commonsImages(name: string, searchTerm: string, coordinates?: number[]): Promise<string[]> {
  const params = new URLSearchParams({
    action: "query", ...(coordinates?.length === 2
      ? { generator: "geosearch", ggscoord: `${coordinates[0]}|${coordinates[1]}`, ggsradius: "10000", ggsprimary: "all", ggsnamespace: "6", ggslimit: "50" }
      : { generator: "search", gsrsearch: `${name} ${searchTerm}`, gsrnamespace: "6", gsrlimit: "10" }),
    prop: "imageinfo", iiprop: "url|mime",
    iiurlwidth: "1280", format: "json",
  });
  let response: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": "GeoFacts/1.0 (educational country explorer)" },
    });
    if (response.ok) break;
    await new Promise((resolve) => setTimeout(resolve, 750 * (attempt + 1)));
  }
  if (!response?.ok) return [];
  const payload = await response.json() as {
    query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; mime?: string }> }> };
  };
  return Object.values(payload.query?.pages || {})
    .filter((page) => page.imageinfo?.[0]?.mime?.startsWith("image/") && !/flag|map|coat of arms|logo|symbol|ISS|STS|earth|satellite|MODIS|astronaut|painting|art project|stamp|pdf|webm/i.test(page.title || ""))
    .map((page) => page.imageinfo?.[0]?.thumburl)
    .filter((url): url is string => Boolean(url));
}

async function countryImageUrls(name: string, coordinates: number[] | undefined, used: Set<string>): Promise<[string, string]> {
  const curated = curatedCountryPhotos[name];
  if (curated) return curated;

  const urls: string[] = [];
  for (const term of ["landscape", "nature", "city"]) {
    for (const url of await commonsImages(name, term, coordinates)) {
      if (!urls.includes(url) && !used.has(url)) urls.push(url);
      if (urls.length === 2) return [urls[0], urls[1]];
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const wikipedia = await wikipediaImageUrl(name);
  if (wikipedia && !urls.includes(wikipedia) && !used.has(wikipedia)) urls.push(wikipedia);
  const first = urls[0] || `${fallbackPhotos[0]}&country=${encodeURIComponent(name)}`;
  const second = urls.find((url) => url !== first) || `${fallbackPhotos[1]}&country=${encodeURIComponent(name)}`;
  return [first, second];
}

async function wikipediaImageUrl(name: string): Promise<string | null> {
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`, {
    headers: { "User-Agent": "GeoFacts/1.0 (educational country explorer)" },
  });
  if (!response.ok) return null;
  const page = await response.json() as { thumbnail?: { source?: string }; originalimage?: { source?: string } };
  const image = page.originalimage?.source || page.thumbnail?.source || null;
  return image && !/flag|map|coat[_ -]?of[_ -]?arms|logo|symbol/i.test(image) ? image : null;
}

async function worldBankPopulations(): Promise<Map<string, number>> {
  const response = await fetch("https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?date=2023&format=json&per_page=4000");
  if (!response.ok) throw new Error(`World Bank returned ${response.status}`);
  const payload = await response.json() as [unknown, Array<{ countryiso3code?: string; value?: number | null }>];
  return new Map((payload[1] || []).filter((row) => row.countryiso3code && row.value).map((row) => [row.countryiso3code!, Math.round(row.value!)]));
}

async function main() {
  const response = await fetch("https://raw.githubusercontent.com/mledoze/countries/master/countries.json");
  if (!response.ok) throw new Error(`REST Countries returned ${response.status}`);
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload)) throw new Error("Country data source returned an invalid payload");
  const countries = payload as RestCountry[];
  const populations = await worldBankPopulations();
  const usedPhotos = new Set<string>();
  for (const country of countries.filter((item) => item.cca3)) {
    const [imageUrl, imageUrl2] = await countryImageUrls(country.name.common, country.latlng, usedPhotos);
    usedPhotos.add(imageUrl); usedPhotos.add(imageUrl2);
    await prisma.country.upsert({
      where: { cca3: country.cca3! },
      create: mapCountry(country, imageUrl, imageUrl2, populations.get(country.cca3!) || territoryPopulationOverrides[country.name.common] || country.population || 0),
      update: mapCountry(country, imageUrl, imageUrl2, populations.get(country.cca3!) || territoryPopulationOverrides[country.name.common] || country.population || 0),
    });
  }
  console.log(`Imported ${countries.length} countries.`);
}
const mapCountry = (country: RestCountry, imageUrl: string, imageUrl2: string, population: number) => ({
  slug: slugify(country.name.common), name: country.name.common, officialName: country.name.official, cca2: country.cca2 || "",
  cca3: country.cca3!, capital: country.capital?.[0] || null, region: country.region || "Other",
  subregion: country.subregion || null, continent: country.region || country.continents?.[0] || "Other",
  flag: country.cca2 ? `https://flagcdn.com/w320/${country.cca2.toLowerCase()}.png` : "", flagAlt: country.name.common === "Saint Martin" ? "French flag used by Saint Martin, a French overseas collectivity" : `${country.name.common} flag`, imageUrl, imageUrl2, population,
  area: country.area || null, languages: Object.values(country.languages || {}), currencies: Object.values(country.currencies || {}).map((currency) => currency.name),
  timezones: country.timezones || [], summary: null, facts: [
    country.landlocked ? "It has no coastline and is completely surrounded by land or other landlocked countries." : null,
    country.borders?.length ? `It shares land borders with ${country.borders.length} neighboring ${country.borders.length === 1 ? "country" : "countries"}.` : null,
    country.timezones && country.timezones.length > 1 ? `It spans ${country.timezones.length} time zones.` : null,
    country.unMember === false ? "It is not a member of the United Nations." : null,
    country.name.common === "Saint Martin" ? "It is a French overseas collectivity and uses the French national flag." : null,
  ].filter((fact): fact is string => Boolean(fact)),
});
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
