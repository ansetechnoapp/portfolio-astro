import {
  fetchPortfolioApiData,
  getPortfolioRuntimeConfig,
  type PortfolioFetchResult,
} from "./portfolio-data-source";
import type {
  AstroBootstrapPayload,
  AstroBootstrapProject,
} from "./portfolio-types";
import { mergePortfolioImages, type PortfolioImageSource } from "./portfolio-images";

function parsePublishDate(value: unknown): Date {
  const date =
    typeof value === "string" && value.trim() ? new Date(value) : new Date();

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function fetchPortfolioAstroBootstrap(
  requestOrigin?: string,
): Promise<PortfolioFetchResult<AstroBootstrapPayload>> {
  const config = getPortfolioRuntimeConfig(requestOrigin);
  return await fetchPortfolioApiData<AstroBootstrapPayload>({
    path: `/api/portfolio/astro/${config.showcaseSlug}/bootstrap`,
    requestOrigin,
  });
}

export function toPortfolioPreviewProject(
  project: AstroBootstrapProject,
  fallback?: PortfolioImageSource,
) {
  const imageData = mergePortfolioImages(
    {
      img: project.data.img,
      img_alt: project.data.img_alt,
      additionalImages: project.data.additionalImages,
    },
    fallback,
  );

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
      publishDate: parsePublishDate(project.data.publishDate),
      tags: project.data.tags || [],
      ...imageData,
      github: project.data.github || undefined,
      liveDemo: project.data.liveDemo || undefined,
      device: project.data.device || undefined,
      isBeta: Boolean(
        project.data.isBeta ||
          project.data.tags?.some((tag) => /beta/i.test(tag)),
      ),
    },
  };
}
