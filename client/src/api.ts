import type { Comment, Country, User } from "./types";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { credentials: "include", headers: { "Content-Type": "application/json", ...init?.headers }, ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
};

export const api = {
  countries: (params: Record<string, string | number> = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "").map(([key, value]) => [key, String(value)]));
    return request<{ countries: Country[]; total: number; page: number; pages: number }>(`/api/countries?${query}`);
  },
  country: (slug: string) => request<{ country: Country }>(`/api/countries/${slug}`),
  comments: (slug: string) => request<{ comments: Comment[] }>(`/api/countries/${slug}/comments`),
  addComment: (slug: string, data: { displayName: string; body: string }) => request<{ comment: Comment }>(`/api/countries/${slug}/comments`, { method: "POST", body: JSON.stringify(data) }),
  rate: (slug: string, value: number) => request<{ average: number; count: number }>(`/api/countries/${slug}/ratings`, { method: "POST", body: JSON.stringify({ value }) }),
  me: () => request<{ user: User | null }>("/api/auth/me"),
  login: (data: { email: string; password: string }) => request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string }) => request<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),
};
