import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import {
  buildPortfolioRequestHeaders,
  fetchPortfolioApiData,
  getPortfolioDataMode,
  getPortfolioRuntimeConfig,
} from "../../lib/portfolio-data-source";
import {
  fetchPortfolioAstroBootstrap,
  toPortfolioPreviewProject,
} from "../../lib/zodback-astro-api";

export const prerender = false;

type StepResult = {
  success: boolean;
  details?: Record<string, unknown>;
  error?: string;
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  return String(error);
}

function getErrorMetadata(error: unknown) {
  if (!(error instanceof Error)) {
    return {
      message: String(error),
    };
  }

  const withCause = error as Error & {
    cause?: {
      code?: string;
      errno?: string | number;
      syscall?: string;
      hostname?: string;
      address?: string;
      port?: number;
      message?: string;
    };
  };

  return {
    message: error.message,
    causeMessage: withCause.cause?.message ?? null,
    code: withCause.cause?.code ?? null,
    errno: withCause.cause?.errno ?? null,
    syscall: withCause.cause?.syscall ?? null,
    hostname: withCause.cause?.hostname ?? null,
    address: withCause.cause?.address ?? null,
    port: withCause.cause?.port ?? null,
  };
}

function findFirstFunctionPath(
  value: unknown,
  currentPath = "root",
  seen = new WeakSet<object>(),
): string | null {
  if (typeof value === "function") {
    return currentPath;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      const match = findFirstFunctionPath(entry, `${currentPath}[${index}]`, seen);
      if (match) return match;
    }
    return null;
  }

  for (const [key, entry] of Object.entries(value)) {
    const match = findFirstFunctionPath(entry, `${currentPath}.${key}`, seen);
    if (match) return match;
  }

  return null;
}

export const GET: APIRoute = async ({ url }) => {
  const requestOrigin = `${url.protocol}//${url.host}`;
  const runtimeConfig = getPortfolioRuntimeConfig(requestOrigin);

  const diagnostics: Record<string, StepResult> = {};

  try {
    const localProjects = await getCollection("work");
    diagnostics.localCollection = {
      success: true,
      details: {
        count: localProjects.length,
        firstSlug: localProjects[0]?.slug ?? null,
      },
    };

    if (localProjects[0]) {
      try {
        const rendered = await localProjects[0].render();
        diagnostics.localRender = {
          success: true,
          details: {
            hasContent: Boolean(rendered?.Content),
          },
        };
      } catch (error) {
        diagnostics.localRender = {
          success: false,
          error: formatError(error),
        };
      }
    }
  } catch (error) {
    diagnostics.localCollection = {
      success: false,
      error: formatError(error),
    };
  }

  try {
    const showcase = await fetchPortfolioApiData<{
      profile?: Record<string, unknown> | null;
      skills?: unknown[];
      experiences?: unknown[];
      projects?: unknown[];
    }>({
      path: `/api/portfolio/showcase/${runtimeConfig.showcaseSlug}`,
      requestOrigin,
    });

    diagnostics.showcaseFetch = {
      success: true,
      details: {
        endpoint: showcase.endpoint ?? null,
        profilePresent: Boolean(showcase.data?.profile),
        skillsCount: showcase.data?.skills?.length ?? 0,
        experiencesCount: showcase.data?.experiences?.length ?? 0,
        projectsCount: showcase.data?.projects?.length ?? 0,
      },
    };
  } catch (error) {
    diagnostics.showcaseFetch = {
      success: false,
      error: formatError(error),
      details: getErrorMetadata(error),
    };
  }

  try {
    const bootstrapResult = await fetchPortfolioAstroBootstrap(requestOrigin);
    const bootstrap = bootstrapResult.data;
    diagnostics.bootstrapFetch = {
      success: true,
      details: {
        source: bootstrapResult.resolvedSource,
        endpoint: bootstrapResult.endpoint ?? null,
        snapshotCapturedAt: bootstrapResult.snapshotCapturedAt ?? null,
        projectsCount: bootstrap?.projects?.length ?? 0,
        firstSlug: bootstrap?.projects?.[0]?.slug ?? null,
      },
    };

    if (bootstrap?.projects?.[0]) {
      try {
        const previewProject = toPortfolioPreviewProject(bootstrap.projects[0]);
        const firstFunctionPath = findFirstFunctionPath({
          previewProject,
        });
        const json = JSON.stringify({
          previewProject,
        });
        diagnostics.previewSerialization = {
          success: true,
          details: {
            jsonLength: json?.length ?? 0,
            hasRenderFunction: typeof previewProject.render === "function",
            firstFunctionPath,
          },
        };
      } catch (error) {
        diagnostics.previewSerialization = {
          success: false,
          error: formatError(error),
        };
      }
    }
  } catch (error) {
    diagnostics.bootstrapFetch = {
      success: false,
      error: formatError(error),
      details: getErrorMetadata(error),
    };
  }

  diagnostics.candidateFetches = {
    success: true,
    details: {
      candidates: await Promise.all(
        runtimeConfig.candidateBases.map(async (base) => {
          const urlValue = `${base.replace(/\/+$/, "")}/api/portfolio/showcase/${runtimeConfig.showcaseSlug}`;

          try {
            const response = await fetch(urlValue, {
              headers: buildPortfolioRequestHeaders({
                apiToken: runtimeConfig.apiToken,
                requestOrigin,
              }),
            });

            const body = await response.text();

            return {
              base,
              ok: response.ok,
              status: response.status,
              bodyPreview: body.slice(0, 120),
            };
          } catch (error) {
            return {
              base,
              ok: false,
              error: getErrorMetadata(error),
            };
          }
        }),
      ),
      apiBaseWithoutAuth: await (async () => {
        const base = runtimeConfig.apiBaseUrl;
        const urlValue = `${base.replace(/\/+$/, "")}/api/portfolio/showcase/${runtimeConfig.showcaseSlug}`;

        try {
          const response = await fetch(urlValue, {
            headers: buildPortfolioRequestHeaders({
              requestOrigin,
            }),
          });

          const body = await response.text();

          return {
            base,
            ok: response.ok,
            status: response.status,
            bodyPreview: body.slice(0, 120),
          };
        } catch (error) {
          return {
            base,
            ok: false,
            error: getErrorMetadata(error),
          };
        }
      })(),
    },
  };

  return new Response(
    JSON.stringify(
      {
        success: true,
        runtime: {
          mode: getPortfolioDataMode(),
          requestOrigin,
          apiBaseUrl: runtimeConfig.apiBaseUrl,
          showcaseSlug: runtimeConfig.showcaseSlug,
          apiTokenPresent: runtimeConfig.apiToken.length > 0,
          vercel: {
            env: process.env.VERCEL_ENV || null,
            gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
            gitCommitRef: process.env.VERCEL_GIT_COMMIT_REF || null,
          },
        },
        diagnostics,
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
