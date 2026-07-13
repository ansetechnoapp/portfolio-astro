import {
  fetchPortfolioApiData,
  getPortfolioRuntimeConfig,
  type PortfolioFetchResult,
} from "./portfolio-data-source";
import type {
  AstroBootstrapPayload,
  AstroBootstrapProject,
} from "./portfolio-types";

export async function fetchPortfolioAstroBootstrap(
  requestOrigin?: string,
): Promise<PortfolioFetchResult<AstroBootstrapPayload>> {
  const config = getPortfolioRuntimeConfig(requestOrigin);
  return await fetchPortfolioApiData<AstroBootstrapPayload>({
    path: `/api/portfolio/astro/${config.showcaseSlug}/bootstrap`,
    requestOrigin,
  });
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
      isBeta: Boolean(
        project.data.isBeta ||
          project.data.tags?.some((tag) => /beta/i.test(tag)),
      ),
      additionalImages: project.data.additionalImages || [],
    },
  };
}
