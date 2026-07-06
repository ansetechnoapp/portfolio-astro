import {
  getSnapshotBlobKey,
  readPortfolioSnapshot,
} from './portfolio-snapshot';

export type PortfolioDataMode = "prefer-api" | "api-required" | "local-only";
export type PortfolioDataSource = "api" | "snapshot" | "local";

export type PortfolioFetchResult<T> = {
  data: T | null;
  endpoint?: string;
  requestOrigin: string;
  mode: PortfolioDataMode;
  resolvedSource: PortfolioDataSource;
  snapshotCapturedAt?: string;
};

const CANONICAL_INTEGRATION_API_BASE_URL = "https://integrations-api.zodev.live";
const LEGACY_PUBLIC_API_BASE_URL = "https://api.zodev.live";
const DEFAULT_REQUEST_ORIGIN = "https://my.zodev.live";

function normalizeMode(value?: string | null): PortfolioDataMode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "prefer-api" ||
    normalized === "api-required" ||
    normalized === "local-only"
  ) {
    return normalized;
  }
  return null;
}

function normalizeOrigin(value?: string | null): string {
  if (!value) return DEFAULT_REQUEST_ORIGIN;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_REQUEST_ORIGIN;
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  return `https://${trimmed.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export function getPortfolioDataMode(): PortfolioDataMode {
  return (
    normalizeMode(import.meta.env.PORTFOLIO_DATA_MODE) ??
    normalizeMode(process.env.PORTFOLIO_DATA_MODE) ??
    "api-required"
  );
}

export function isApiRequiredMode(mode = getPortfolioDataMode()): boolean {
  return mode === "api-required";
}

export function isLocalOnlyMode(mode = getPortfolioDataMode()): boolean {
  return mode === "local-only";
}

export function getPortfolioRuntimeConfig(requestOrigin?: string) {
  const mode = getPortfolioDataMode();
  const apiBaseUrl =
    import.meta.env.PORTFOLIO_API_BASE_URL?.trim() ||
    process.env.PORTFOLIO_API_BASE_URL?.trim() ||
    CANONICAL_INTEGRATION_API_BASE_URL;
  const apiToken =
    import.meta.env.PORTFOLIO_API_TOKEN?.trim() ||
    process.env.PORTFOLIO_API_TOKEN?.trim() ||
    "";
  const requestOriginValue = normalizeOrigin(
    requestOrigin ||
      import.meta.env.PORTFOLIO_API_ORIGIN ||
      process.env.PORTFOLIO_API_ORIGIN ||
      DEFAULT_REQUEST_ORIGIN,
  );
  const showcaseSlug =
    import.meta.env.PORTFOLIO_SHOWCASE_SLUG?.trim() ||
    process.env.PORTFOLIO_SHOWCASE_SLUG?.trim() ||
    "main-portfolio";
  const candidateBases = Array.from(
    new Set(
      mode === "api-required"
        ? [apiBaseUrl, CANONICAL_INTEGRATION_API_BASE_URL, LEGACY_PUBLIC_API_BASE_URL]
        : [
            apiBaseUrl,
            CANONICAL_INTEGRATION_API_BASE_URL,
            "http://127.0.0.1:3031",
            "http://127.0.0.1:3013",
            LEGACY_PUBLIC_API_BASE_URL,
          ],
    ),
  ).filter(Boolean);

  return {
    apiBaseUrl,
    apiToken,
    canonicalApiBaseUrl: CANONICAL_INTEGRATION_API_BASE_URL,
    candidateBases,
    legacyApiBaseUrl: LEGACY_PUBLIC_API_BASE_URL,
    mode,
    requestOrigin: requestOriginValue,
    showcaseSlug,
  };
}

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

const API_TIMEOUT = 2500; // 2.5 seconds before fallback to snapshot as per requirements

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function fetchPortfolioApiData<T>({
  path,
  requestOrigin,
}: {
  path: string;
  requestOrigin?: string;
}): Promise<PortfolioFetchResult<T>> {
  const config = getPortfolioRuntimeConfig(requestOrigin);

  if (isLocalOnlyMode(config.mode)) {
    return {
      data: null,
      mode: config.mode,
      requestOrigin: config.requestOrigin,
      resolvedSource: "local",
    };
  }

  if (isApiRequiredMode(config.mode) && !config.apiToken) {
    throw new Error(
      "PORTFOLIO_API_TOKEN is required when PORTFOLIO_DATA_MODE=api-required",
    );
  }

  let lastError: Error | null = null;

  // First try all API bases with timeout
  for (const base of config.candidateBases) {
    const url = joinUrl(base, path);

    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          Accept: "application/json",
          Origin: config.requestOrigin,
          ...(config.apiToken
            ? { Authorization: `Bearer ${config.apiToken}` }
            : {}),
        },
      }, API_TIMEOUT);

      if (!response.ok) {
        const bodyPreview = (await response.text()).slice(0, 160).replace(/\s+/g, " ");
        lastError = new Error(
          `HTTP ${response.status} for ${url}${
            bodyPreview ? `: ${bodyPreview}` : ""
          }`,
        );
        continue;
      }

      const payload = (await response.json()) as {
        data?: T;
      };

      if (payload?.data !== undefined && payload?.data !== null) {
        return {
          data: payload.data,
          endpoint: url,
          mode: config.mode,
          requestOrigin: config.requestOrigin,
          resolvedSource: "api",
        };
      }

      lastError = new Error(`Empty payload for ${url}`);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(`Unknown error for ${url}`);
    }
  }

  // All APIs failed, try snapshot fallback
  console.warn(`All portfolio APIs failed for ${path}, attempting snapshot fallback... Error: ${lastError?.message}`);

  const snapshot = await readPortfolioSnapshot(config.showcaseSlug);
  if (snapshot) {
    // Check which payload we need based on the path
    let snapshotData: unknown = null;
    if (path.includes('/astro/') && path.includes('/bootstrap')) {
      snapshotData = snapshot.payloads.astroBootstrap;
    } else if (path.includes('/showcase/')) {
      snapshotData = snapshot.payloads.showcase;
    }

    if (snapshotData !== null && snapshotData !== undefined) {
      console.log(`✅ Successfully loaded snapshot fallback for ${path}, captured at ${snapshot.capturedAt}`);
      return {
        data: snapshotData as T,
        endpoint: `snapshot:${path}`,
        mode: config.mode,
        requestOrigin: config.requestOrigin,
        resolvedSource: "snapshot",
        snapshotCapturedAt: snapshot.capturedAt,
      };
    }
  }

  // If we reach here, both API and snapshot failed
  if (isApiRequiredMode(config.mode)) {
    throw new Error(
      `Portfolio API required but unavailable and no valid snapshot found for ${path}: ${
        lastError?.message || "unknown error"
      }`,
    );
  }

  return {
    data: null,
    mode: config.mode,
    requestOrigin: config.requestOrigin,
    resolvedSource: "local",
  };
}

export function applyPortfolioResponseHeaders(
  headers: Headers,
  {
    source,
    mode,
    endpoint,
    requestOrigin,
    snapshotCapturedAt,
  }: {
    source: PortfolioDataSource;
    mode: PortfolioDataMode;
    endpoint?: string;
    requestOrigin: string;
    snapshotCapturedAt?: string;
  },
) {
  headers.set("x-portfolio-data-source", source);
  headers.set("x-portfolio-data-mode", mode);
  headers.set("x-portfolio-request-origin", requestOrigin);
  if (endpoint) {
    headers.set("x-portfolio-api-endpoint", endpoint);
  }
  if (snapshotCapturedAt) {
    headers.set("x-portfolio-snapshot-captured-at", snapshotCapturedAt);
  }
}

export function getPortfolioSnapshotEndpoint(showcaseSlug: string) {
  return `snapshot:${getSnapshotBlobKey(showcaseSlug)}`;
}
