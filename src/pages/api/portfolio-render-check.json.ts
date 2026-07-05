import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { stringify } from "devalue";
import {
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
    };
  }

  try {
    const bootstrap = await fetchPortfolioAstroBootstrap(requestOrigin);
    diagnostics.bootstrapFetch = {
      success: true,
      details: {
        projectsCount: bootstrap?.projects?.length ?? 0,
        firstSlug: bootstrap?.projects?.[0]?.slug ?? null,
      },
    };

    if (bootstrap?.projects?.[0]) {
      try {
        const previewProject = toPortfolioPreviewProject(bootstrap.projects[0]);
        const serialized = stringify({
          previewProject,
        });
        diagnostics.previewSerialization = {
          success: true,
          details: {
            serializedLength: serialized.length,
            hasRenderFunction: typeof previewProject.render === "function",
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
    };
  }

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
