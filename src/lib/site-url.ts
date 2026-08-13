import { withBase } from "./app-base";

const rawSiteUrl = typeof import.meta !== "undefined" ? import.meta.env.VITE_SITE_URL : "";

export const siteUrl = typeof rawSiteUrl === "string" && rawSiteUrl.trim().length > 0
  ? rawSiteUrl.trim().replace(/\/+$/, "")
  : "";

export function buildSiteUrl(path = "/") {
  if (!siteUrl) return null;
  return new URL(withBase(path), `${siteUrl}/`).toString();
}
