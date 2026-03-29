import { CONFIG } from "lib/config";

const PORTAL_JWT_STORAGE_KEY = "sunflower_land_portal_jwt";

function normalizeApiBase(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Resolves the Sunflower Land API base URL for portal/minigame requests.
 * Parent iframe passes `apiUrl` (from Sunflower Land `CONFIG.API_URL`); when valid
 * it wins over `network`-based defaults.
 */
export const getUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const apiUrlParam = params.get("apiUrl");
  if (apiUrlParam) {
    try {
      const parsed = new URL(apiUrlParam);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return normalizeApiBase(apiUrlParam);
      }
    } catch {
      // ignore invalid apiUrl, fall through
    }
  }

  const network = params.get("network");

  if (network && network === "mainnet") {
    return "https://api.sunflower-land.com";
  }

  if (network) {
    return "https://api-dev.sunflower-land.com";
  }

  return CONFIG.API_URL;
};

/**
 * Portal JWT: read from `?jwt=` when present (and persist to sessionStorage),
 * otherwise reuse the last token from this tab so refresh and client-side
 * navigation without the query string stay authorised.
 */
export const getJwt = (): string | null => {
  const params = new URLSearchParams(window.location.search);

  if (params.has("jwt")) {
    const fromUrl = params.get("jwt") ?? "";
    try {
      if (fromUrl) {
        sessionStorage.setItem(PORTAL_JWT_STORAGE_KEY, fromUrl);
      } else {
        sessionStorage.removeItem(PORTAL_JWT_STORAGE_KEY);
      }
    } catch {
      // private mode / quota
    }
    return fromUrl || null;
  }

  try {
    const stored = sessionStorage.getItem(PORTAL_JWT_STORAGE_KEY);
    return stored && stored.length > 0 ? stored : null;
  } catch {
    return null;
  }
};

/** Clears the tab-scoped portal JWT (e.g. after explicit logout or `?jwt=`). */
export const clearPersistedPortalJwt = () => {
  try {
    sessionStorage.removeItem(PORTAL_JWT_STORAGE_KEY);
  } catch {
    // ignore
  }
};
