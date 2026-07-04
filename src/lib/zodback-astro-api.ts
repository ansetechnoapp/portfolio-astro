type AstroBootstrapProject = {
  id: string;
  slug: string;
  bodyMarkdown?: string;
  data: {
    title: string;
    description: string;
    tech?: string[];
    publishDate?: string | null;
    number?: number | null;
    tags?: string[];
    img?: string;
    img_alt?: string | null;
    github?: string | null;
    liveDemo?: string | null;
    device?: string | null;
    client?: string | null;
    services?: string[];
    projectType?: string | null;
    duration?: string | null;
    challenge?: string | null;
    solution?: string | null;
    additionalImages?: Array<{
      url: string;
      alt?: string;
      caption?: string;
    }>;
    features?: Array<Record<string, unknown>>;
    demoVideo?: Record<string, unknown> | null;
  };
};

type AstroBootstrapPayload = {
  user?: Record<string, unknown>;
  timelineEvents?: Array<Record<string, unknown>>;
  projects?: AstroBootstrapProject[];
};

const PORTFOLIO_API_BASE_URL =
  import.meta.env.PORTFOLIO_API_BASE_URL?.trim() || "https://api.zodev.live";
const PORTFOLIO_API_ORIGIN =
  import.meta.env.PORTFOLIO_API_ORIGIN?.trim() || "https://portfolio.zodev.live";
const PORTFOLIO_API_TOKEN = import.meta.env.PORTFOLIO_API_TOKEN?.trim() || "";
const PORTFOLIO_SHOWCASE_SLUG =
  import.meta.env.PORTFOLIO_SHOWCASE_SLUG?.trim() || "main-portfolio";

function joinUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function fetchPortfolioAstroBootstrap(): Promise<AstroBootstrapPayload | null> {
  const candidateBases = Array.from(
    new Set([
      PORTFOLIO_API_BASE_URL,
      "http://127.0.0.1:3031",
      "http://127.0.0.1:3013",
      "https://api.zodev.live",
    ]),
  ).filter(Boolean);

  for (const base of candidateBases) {
    const url = joinUrl(
      base,
      `/api/portfolio/astro/${PORTFOLIO_SHOWCASE_SLUG}/bootstrap`,
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Origin: PORTFOLIO_API_ORIGIN,
          ...(PORTFOLIO_API_TOKEN
            ? { Authorization: `Bearer ${PORTFOLIO_API_TOKEN}` }
            : {}),
        },
      });

      if (!response.ok) continue;

      const payload = (await response.json()) as {
        data?: AstroBootstrapPayload;
      };

      if (payload?.data) {
        return payload.data;
      }
    } catch (error) {
      console.warn(`Astro bootstrap API unavailable for ${url}`, error);
    }
  }

  return null;
}

export function toPortfolioPreviewProject(project: AstroBootstrapProject) {
  return {
    id: project.id,
    slug: project.slug,
    body: project.bodyMarkdown || "",
    collection: "work",
    render: async () => ({}),
    data: {
      title: project.data.title,
      description: project.data.description,
      tech: project.data.tech || [],
      publishDate: project.data.publishDate
        ? new Date(project.data.publishDate)
        : new Date(),
      tags: project.data.tags || [],
      img: project.data.img || "/assets/social-preview.jpg",
      img_alt: project.data.img_alt || undefined,
      github: project.data.github || undefined,
      liveDemo: project.data.liveDemo || undefined,
      device: project.data.device || undefined,
      additionalImages: project.data.additionalImages || [],
    },
  };
}
