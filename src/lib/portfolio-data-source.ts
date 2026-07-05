export type PortfolioDataMode = "prefer-api" | "api-required" | "local-only";
export type PortfolioDataSource = "api" | "local";

export type PortfolioFetchResult<T> = {
  data: T | null;
  endpoint?: string;
  requestOrigin: string;
  mode: PortfolioDataMode;
};

const DEFAULT_API_BASE_URL = "https://api.zodev.live";
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
    "prefer-api"
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
    DEFAULT_API_BASE_URL;
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
    new Set([
      apiBaseUrl,
      "http://127.0.0.1:3031",
      "http://127.0.0.1:3013",
      DEFAULT_API_BASE_URL,
    ]),
  ).filter(Boolean);

  return {
    apiBaseUrl,
    apiToken,
    candidateBases,
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
    };
  }

  if (isApiRequiredMode(config.mode) && !config.apiToken) {
    throw new Error(
      "PORTFOLIO_API_TOKEN is required when PORTFOLIO_DATA_MODE=api-required",
    );
  }

  let lastError: Error | null = null;

  for (const base of config.candidateBases) {
    const url = joinUrl(base, path);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Origin: config.requestOrigin,
          ...(config.apiToken
            ? { Authorization: `Bearer ${config.apiToken}` }
            : {}),
        },
      });

      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status} for ${url}`);
        continue;
      }

      const payload = (await response.json()) as {
        data?: T;
      };

      if (payload?.data) {
        return {
          data: payload.data,
          endpoint: url,
          mode: config.mode,
          requestOrigin: config.requestOrigin,
        };
      }

      lastError = new Error(`Empty payload for ${url}`);
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error(`Unknown error for ${url}`);
    }
  }

  if (isApiRequiredMode(config.mode)) {
    throw new Error(
      `Portfolio API required but unavailable for ${path}: ${
        lastError?.message || "unknown error"
      }`,
    );
  }

  return {
    data: null,
    mode: config.mode,
    requestOrigin: config.requestOrigin,
  };
}

export function applyPortfolioResponseHeaders(
  headers: Headers,
  {
    source,
    mode,
    endpoint,
    requestOrigin,
  }: {
    source: PortfolioDataSource;
    mode: PortfolioDataMode;
    endpoint?: string;
    requestOrigin: string;
  },
) {
  headers.set("x-portfolio-data-source", source);
  headers.set("x-portfolio-data-mode", mode);
  headers.set("x-portfolio-request-origin", requestOrigin);
  if (endpoint) {
    headers.set("x-portfolio-api-endpoint", endpoint);
  }
}
