import { describe, expect, test } from "bun:test";
import {
  buildResponsiveImageSources,
  mergePortfolioImages,
  PORTFOLIO_FALLBACK_IMAGE,
} from "./portfolio-images";

describe("portfolio-images", () => {
  test("does not generate responsive variants for remote media URLs", () => {
    expect(
      buildResponsiveImageSources(
        "https://api.zodev.live/api/shared-data/v1/media-public?path=shared-media%2F72%2Fimage.png",
      ),
    ).toBeNull();
  });

  test("generates responsive variants for local public images", () => {
    expect(
      buildResponsiveImageSources("/assets/myprojects/example-image.png"),
    ).toEqual({
      avifSrcSet:
        "/assets/myprojects/example-image_optimized.avif 1x, /assets/myprojects/example-image_640w.avif 640w, /assets/myprojects/example-image_1024w.avif 1024w",
      webpSrcSet:
        "/assets/myprojects/example-image_optimized.webp 1x, /assets/myprojects/example-image_640w.webp 640w, /assets/myprojects/example-image_1024w.webp 1024w",
    });
  });

  test("keeps the ZodBack image first and preserves the local fallback", () => {
    const result = mergePortfolioImages(
      {
        img: "https://api.zodev.live/api/shared-data/v1/media-public?path=shared-media%2F72%2Fimage.png",
        img_alt: "Remote image",
        additionalImages: [
          {
            url: "https://api.zodev.live/api/shared-data/v1/media-public?path=shared-media%2F72%2Fgallery.png",
            alt: "Remote gallery",
          },
        ],
      },
      {
        img: "/assets/myprojects/local-fallback.webp",
        img_alt: "Local fallback",
        additionalImages: [
          {
            url: "/assets/myprojects/local-gallery.webp",
            alt: "Local gallery",
          },
        ],
      },
    );

    expect(result.img).toContain("api.zodev.live");
    expect(result.fallbackImg).toBe("/assets/myprojects/local-fallback.webp");
    expect(result.img_alt).toBe("Remote image");
    expect(result.additionalImages[0]).toEqual({
      url:
        "https://api.zodev.live/api/shared-data/v1/media-public?path=shared-media%2F72%2Fgallery.png",
      alt: "Remote gallery",
      caption: undefined,
      fallbackUrl: "/assets/myprojects/local-gallery.webp",
    });
  });

  test("falls back to the local portfolio image when the remote image is absent", () => {
    const result = mergePortfolioImages(
      {
        img: undefined,
        img_alt: undefined,
      },
      {
        img: "/assets/myprojects/local-fallback.webp",
        img_alt: "Local fallback",
      },
    );

    expect(result.img).toBe("/assets/myprojects/local-fallback.webp");
    expect(result.fallbackImg).toBeUndefined();
    expect(result.img_alt).toBe("Local fallback");
    expect(PORTFOLIO_FALLBACK_IMAGE).toBe("/assets/social-preview.jpg");
  });
});
