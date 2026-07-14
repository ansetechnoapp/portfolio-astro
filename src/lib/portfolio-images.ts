export const PORTFOLIO_FALLBACK_IMAGE = "/assets/social-preview.jpg";

export type PortfolioImageSource = {
  img?: string | null;
  img_alt?: string | null;
  additionalImages?: Array<{
    url?: string | null;
    alt?: string | null;
    caption?: string | null;
  } | null>;
};

export type PortfolioResolvedImage = {
  url: string;
  alt?: string;
  caption?: string;
  fallbackUrl?: string;
};

export type PortfolioImageResolution = {
  img: string;
  img_alt?: string;
  fallbackImg?: string;
  additionalImages: PortfolioResolvedImage[];
};

type ResponsiveImageSources = {
  avifSrcSet: string;
  webpSrcSet: string;
};

function normalizeText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolvePortfolioImage(value?: string | null): string | undefined {
  const trimmed = normalizeText(value);
  if (!trimmed) return undefined;

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed.replace(/^\/+/, "")}`;
}

export function normalizePortfolioImage(value?: string | null): string {
  return resolvePortfolioImage(value) || PORTFOLIO_FALLBACK_IMAGE;
}

export function isOptimizablePortfolioImage(value?: string | null): boolean {
  const resolved = resolvePortfolioImage(value);
  return Boolean(
    resolved &&
      resolved.startsWith("/") &&
      !resolved.startsWith("//") &&
      !/[?#]/.test(resolved) &&
      /\.(jpg|jpeg|png|gif)$/i.test(resolved),
  );
}

export function buildResponsiveImageSources(
  value?: string | null,
): ResponsiveImageSources | null {
  if (!isOptimizablePortfolioImage(value)) {
    return null;
  }

  const resolved = resolvePortfolioImage(value);
  if (!resolved) return null;

  const basePath = resolved.replace(/\.(jpg|jpeg|png|gif)$/i, "");

  return {
    avifSrcSet: `${basePath}_optimized.avif 1x, ${basePath}_640w.avif 640w, ${basePath}_1024w.avif 1024w`,
    webpSrcSet: `${basePath}_optimized.webp 1x, ${basePath}_640w.webp 640w, ${basePath}_1024w.webp 1024w`,
  };
}

function normalizeAdditionalImages(
  images?: PortfolioImageSource["additionalImages"],
): Array<{
  url?: string;
  alt?: string;
  caption?: string;
}> {
  if (!Array.isArray(images)) return [];

  return images
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;

      return {
        url: resolvePortfolioImage(entry.url),
        alt: normalizeText(entry.alt),
        caption: normalizeText(entry.caption),
      };
    })
    .filter(
      (
        image,
      ): image is {
        url?: string;
        alt?: string;
        caption?: string;
      } => Boolean(image),
    );
}

export function mergePortfolioImages(
  primary: PortfolioImageSource,
  fallback?: PortfolioImageSource,
): PortfolioImageResolution {
  const primaryImg = resolvePortfolioImage(primary.img);
  const fallbackImg = resolvePortfolioImage(fallback?.img);
  const img = primaryImg ?? fallbackImg ?? PORTFOLIO_FALLBACK_IMAGE;

  const primaryAlt = normalizeText(primary.img_alt);
  const fallbackAlt = normalizeText(fallback?.img_alt);

  const primaryAdditionalImages = normalizeAdditionalImages(
    primary.additionalImages,
  );
  const fallbackAdditionalImages = normalizeAdditionalImages(
    fallback?.additionalImages,
  );
  const additionalImages = Array.from(
    { length: Math.max(primaryAdditionalImages.length, fallbackAdditionalImages.length) },
    (_, index) => {
      const primaryImage = primaryAdditionalImages[index];
      const fallbackImage = fallbackAdditionalImages[index];
      const resolvedUrl =
        primaryImage?.url || fallbackImage?.url || PORTFOLIO_FALLBACK_IMAGE;

      return {
        url: resolvedUrl,
        alt: primaryImage?.alt || fallbackImage?.alt,
        caption: primaryImage?.caption || fallbackImage?.caption,
        fallbackUrl:
          primaryImage?.url &&
          fallbackImage?.url &&
          fallbackImage.url !== resolvedUrl
            ? fallbackImage.url
            : undefined,
      };
    },
  );

  return {
    img,
    img_alt: primaryAlt || fallbackAlt,
    fallbackImg: fallbackImg && fallbackImg !== img ? fallbackImg : undefined,
    additionalImages,
  };
}
