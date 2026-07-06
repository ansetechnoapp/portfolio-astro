import type { APIRoute } from 'astro';
import { getPortfolioRuntimeConfig } from '../../lib/portfolio-data-source';
import { writePortfolioSnapshot } from '../../lib/portfolio-snapshot';
import type { PortfolioSyncRequest } from '../../lib/portfolio-types';

const DEFAULT_SHOWCASE_SLUG = 'main-portfolio';
const SYNC_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = SYNC_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function getExpectedSecret() {
  return (
    import.meta.env.PORTFOLIO_SNAPSHOT_SYNC_SECRET ||
    process.env.PORTFOLIO_SNAPSHOT_SYNC_SECRET ||
    ''
  ).trim();
}

function normalizeBaseUrl(base: string) {
  return base.replace(/\/+$/, '');
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  const requestSecret = request.headers.get('x-portfolio-sync-secret');
  const expectedSecret = getExpectedSecret();

  if (!expectedSecret || requestSecret !== expectedSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized: invalid sync secret' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    return new Response(
      JSON.stringify({ success: false, error: 'Content-Type must be application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  }

  let body: PortfolioSyncRequest;
  try {
    body = (await request.json()) as PortfolioSyncRequest;
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON request body' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  }

  const showcaseSlug = body.showcaseSlug?.trim() || DEFAULT_SHOWCASE_SLUG;
  const reason = body.reason || 'manual';
  const requestOrigin = `${url.protocol}//${url.host}`;
  const config = getPortfolioRuntimeConfig(requestOrigin);

  if (!config.apiToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'PORTFOLIO_API_TOKEN is required to refresh the snapshot',
        reason,
        showcaseSlug,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      },
    );
  }

  const authHeaders = {
    Accept: 'application/json',
    Origin: config.requestOrigin,
    Authorization: `Bearer ${config.apiToken}`,
  };

  let lastError: string | null = null;

  for (const base of config.candidateBases) {
    const normalizedBase = normalizeBaseUrl(base);
    const showcaseUrl = `${normalizedBase}/api/portfolio/showcase/${showcaseSlug}`;
    const astroBootstrapUrl = `${normalizedBase}/api/portfolio/astro/${showcaseSlug}/bootstrap`;

    try {
      const [showcaseResponse, astroBootstrapResponse] = await Promise.all([
        fetchWithTimeout(showcaseUrl, { headers: authHeaders }),
        fetchWithTimeout(astroBootstrapUrl, { headers: authHeaders }),
      ]);

      if (!showcaseResponse.ok || !astroBootstrapResponse.ok) {
        const [showcaseError, astroBootstrapError] = await Promise.all([
          showcaseResponse.ok ? Promise.resolve(null) : readJsonResponse(showcaseResponse),
          astroBootstrapResponse.ok
            ? Promise.resolve(null)
            : readJsonResponse(astroBootstrapResponse),
        ]);

        lastError = [
          `base=${normalizedBase}`,
          `showcase=${showcaseResponse.status}${
            showcaseError ? ` ${JSON.stringify(showcaseError).slice(0, 160)}` : ''
          }`,
          `bootstrap=${astroBootstrapResponse.status}${
            astroBootstrapError ? ` ${JSON.stringify(astroBootstrapError).slice(0, 160)}` : ''
          }`,
        ].join(' ');
        continue;
      }

      const [showcaseData, astroBootstrapData] = await Promise.all([
        readJsonResponse(showcaseResponse),
        readJsonResponse(astroBootstrapResponse),
      ]);

      const showcasePayload = showcaseData as
        | { success?: boolean; data?: unknown }
        | null;
      const astroBootstrapPayload = astroBootstrapData as
        | { success?: boolean; data?: unknown }
        | null;

      if (
        !showcasePayload ||
        !astroBootstrapPayload ||
        typeof showcasePayload !== 'object' ||
        typeof astroBootstrapPayload !== 'object' ||
        !showcasePayload.success ||
        !astroBootstrapPayload.success ||
        showcasePayload.data === undefined ||
        astroBootstrapPayload.data === undefined
      ) {
        lastError = `base=${normalizedBase} returned an incomplete payload`;
        continue;
      }

      const snapshot = await writePortfolioSnapshot({
        showcaseSlug,
        reason,
        source: 'zodback',
        upstream: {
          showcaseEndpoint: showcaseUrl,
          astroBootstrapEndpoint: astroBootstrapUrl,
        },
        payloads: {
          showcase: showcasePayload.data,
          astroBootstrap: astroBootstrapPayload.data,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          blobKey: snapshot.blobKey,
          capturedAt: snapshot.capturedAt,
          reason,
          showcaseSlug,
          sourceBase: normalizedBase,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      );
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: lastError || 'Unable to refresh the portfolio snapshot',
      reason,
      showcaseSlug,
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    },
  );
};
