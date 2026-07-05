import {
  fetchPortfolioApiData,
  getPortfolioRuntimeConfig,
} from "./portfolio-data-source";
import type {
  AstroBootstrapPayload,
  AstroBootstrapProject,
} from "./portfolio-types";

export async function fetchPortfolioAstroBootstrap(
  requestOrigin?: string,
): Promise<AstroBootstrapPayload | null> {
  const config = getPortfolioRuntimeConfig(requestOrigin);
  const result = await fetchPortfolioApiData<AstroBootstrapPayload>({
    path: `/api/portfolio/astro/${config.showcaseSlug}/bootstrap`,
    requestOrigin,
  });

  return result.data;
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
