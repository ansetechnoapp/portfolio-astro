import type { APIRoute } from "astro";
import { getPortfolioDataMode, getPortfolioRuntimeConfig } from "../../lib/portfolio-data-source";
import { getSnapshotMetadata } from "../../lib/portfolio-snapshot";

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const requestOrigin = `${url.protocol}//${url.host}`;
  const runtimeConfig = getPortfolioRuntimeConfig(requestOrigin);
  const snapshotMetadata = await getSnapshotMetadata(runtimeConfig.showcaseSlug);

  return new Response(
    JSON.stringify(
      {
        success: true,
        runtime: {
          mode: getPortfolioDataMode(),
          requestOrigin,
          apiBaseUrl: runtimeConfig.apiBaseUrl,
          canonicalApiBaseUrl: runtimeConfig.canonicalApiBaseUrl,
          legacyApiBaseUrl: runtimeConfig.legacyApiBaseUrl,
          candidateBases: runtimeConfig.candidateBases,
          showcaseSlug: runtimeConfig.showcaseSlug,
          apiTokenPresent: runtimeConfig.apiToken.length > 0,
          apiTokenLength: runtimeConfig.apiToken.length,
          snapshotAvailable: snapshotMetadata.available,
          snapshotCapturedAt: snapshotMetadata.capturedAt,
          lastResolvedSource: snapshotMetadata.available ? "snapshot" : "unknown",
          importMeta: {
            modePresent: Boolean(import.meta.env.PORTFOLIO_DATA_MODE),
            apiBaseUrlPresent: Boolean(import.meta.env.PORTFOLIO_API_BASE_URL),
            apiTokenPresent: Boolean(import.meta.env.PORTFOLIO_API_TOKEN),
            showcaseSlugPresent: Boolean(import.meta.env.PORTFOLIO_SHOWCASE_SLUG),
            syncSecretPresent: Boolean(import.meta.env.PORTFOLIO_SNAPSHOT_SYNC_SECRET),
            blobTokenPresent: Boolean(import.meta.env.BLOB_READ_WRITE_TOKEN),
          },
          processEnv: {
            modePresent: Boolean(process.env.PORTFOLIO_DATA_MODE),
            apiBaseUrlPresent: Boolean(process.env.PORTFOLIO_API_BASE_URL),
            apiTokenPresent: Boolean(process.env.PORTFOLIO_API_TOKEN),
            showcaseSlugPresent: Boolean(process.env.PORTFOLIO_SHOWCASE_SLUG),
            syncSecretPresent: Boolean(process.env.PORTFOLIO_SNAPSHOT_SYNC_SECRET),
            blobTokenPresent: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
          },
          vercel: {
            env: process.env.VERCEL_ENV || null,
            gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
            gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
          },
        },
      },
      null,
      2,
    ),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
};
