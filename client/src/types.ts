export type Country = {
  id: string; slug: string; name: string; officialName: string; cca2: string; cca3: string;
  capital: string | null; region: string; subregion: string | null; continent: string;
  flag: string; flagAlt: string | null; imageUrl: string | null; imageUrl2: string | null; facts: string[]; population: number; area: number | null;
  languages: string[]; currencies: string[]; timezones: string[]; summary: string | null;
  ratingAverage: number; ratingCount: number; commentCount?: number;
};
export type Comment = { id: string; displayName: string; body: string; createdAt: string; user?: { name: string } | null };
export type User = { id: string; name: string; email: string };
