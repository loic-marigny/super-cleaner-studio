const rawBaseUrl = import.meta.env.BASE_URL || "/";

export const appBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;
export const appBasePath = appBaseUrl === "/" ? "/" : appBaseUrl.replace(/\/$/, "");

export function withBase(path: string) {
  return `${appBaseUrl}${path.replace(/^\/+/, "")}`;
}
