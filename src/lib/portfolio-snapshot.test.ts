import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  test,
} from "bun:test";
import type {
  AstroBootstrapPayload,
  AstroBootstrapProject,
  PortfolioSnapshotV1,
} from "./portfolio-types";

type BlobResponse = {
  statusCode: number;
  stream?: ReadableStream<Uint8Array>;
};

const textEncoder = new TextEncoder();

function streamFromText(text: string) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(textEncoder.encode(text));
      controller.close();
    },
  });
}

let putCalls: Array<[string, string, Record<string, unknown>]> = [];
let blobResponse: BlobResponse | null = null;

mock.module("@vercel/blob", () => ({
  put: async (
    blobKey: string,
    body: string,
    options: Record<string, unknown>,
  ) => {
    putCalls.push([blobKey, body, options]);
    return { url: `https://blob.test/${blobKey}` };
  },
  get: async () => blobResponse,
}));

const {
  getSnapshotBlobKey,
  readPortfolioSnapshot,
  writePortfolioSnapshot,
} = await import("./portfolio-snapshot");
const { toPortfolioPreviewProject } = await import("./zodback-astro-api");
const {
  buildPortfolioRequestHeaders,
  fetchPortfolioApiData,
  getPortfolioSnapshotEndpoint,
} = await import("./portfolio-data-source");

describe("portfolio-snapshot", () => {
  beforeEach(() => {
    putCalls = [];
    blobResponse = null;
  });

  test("builds the expected blob key", () => {
    expect(getSnapshotBlobKey()).toBe(
      "portfolio-snapshots/main-portfolio/latest.json",
    );
    expect(getSnapshotBlobKey("custom-showcase")).toBe(
      "portfolio-snapshots/custom-showcase/latest.json",
    );
  });

  test("writes a private snapshot blob with overwrite enabled", async () => {
    const snapshot = await writePortfolioSnapshot({
      showcaseSlug: "main-portfolio",
      source: "zodback",
      reason: "webhook",
      upstream: {
        showcaseEndpoint: "https://example.test/showcase",
        astroBootstrapEndpoint: "https://example.test/bootstrap",
      },
      payloads: {
        showcase: { success: true },
        astroBootstrap: { success: true },
      },
    });

    expect(putCalls).toHaveLength(1);
    const [blobKey, body, options] = putCalls[0];
    const parsed = JSON.parse(body) as PortfolioSnapshotV1;

    expect(blobKey).toBe("portfolio-snapshots/main-portfolio/latest.json");
    expect(options).toMatchObject({
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
      contentType: "application/json",
    });
    expect(parsed.version).toBe(1);
    expect(parsed.reason).toBe("webhook");
    expect(snapshot).toMatchObject({
      blobKey,
      url: `https://blob.test/${blobKey}`,
    });
    expect(typeof snapshot.capturedAt).toBe("string");
  });

  test("reads a valid snapshot blob", async () => {
    const expected: PortfolioSnapshotV1 = {
      version: 1,
      showcaseSlug: "main-portfolio",
      capturedAt: "2026-07-06T00:00:00.000Z",
      source: "zodback",
      reason: "scheduled-reconcile",
      upstream: {
        showcaseEndpoint: "https://example.test/showcase",
        astroBootstrapEndpoint: "https://example.test/bootstrap",
      },
      payloads: {
        showcase: { hero: "snapshot" },
        astroBootstrap: { projects: [] },
      },
    };

    blobResponse = {
      statusCode: 200,
      stream: streamFromText(JSON.stringify(expected)),
    };

    await expect(readPortfolioSnapshot()).resolves.toEqual(expected);
  });

  test("returns null for invalid or missing snapshot blobs", async () => {
    blobResponse = { statusCode: 404 };

    await expect(readPortfolioSnapshot()).resolves.toBeNull();
  });

  test("returns null when the snapshot is structurally incomplete", async () => {
    blobResponse = {
      statusCode: 200,
      stream: streamFromText(
        JSON.stringify({
          version: 1,
          showcaseSlug: "main-portfolio",
          capturedAt: "2026-07-06T00:00:00.000Z",
          source: "zodback",
          reason: "webhook",
          upstream: {
            showcaseEndpoint: "https://example.test/showcase",
            astroBootstrapEndpoint: "https://example.test/bootstrap",
          },
          payloads: {
            showcase: { hero: "snapshot" },
          },
        }),
      ),
    };

    await expect(readPortfolioSnapshot()).resolves.toBeNull();
  });
});

describe("zodback-astro-api", () => {
  test("propagates the beta flag into preview projects", () => {
    const previewProject = toPortfolioPreviewProject({
      id: "project-1",
      slug: "beta-project",
      bodyMarkdown: "## Beta project",
      data: {
        title: "Beta project",
        description: "Preview project",
        isBeta: true,
      },
    } as AstroBootstrapProject);

    expect(previewProject.data.isBeta).toBe(true);
  });

  test("derives the beta flag from beta tags when the explicit flag is absent", () => {
    const previewProject = toPortfolioPreviewProject({
      id: "project-2",
      slug: "tagged-beta-project",
      bodyMarkdown: "## Tagged beta project",
      data: {
        title: "Tagged beta project",
        description: "Preview project",
        tags: ["Beta", "Showcase"],
      },
    } as AstroBootstrapProject);

    expect(previewProject.data.isBeta).toBe(true);
  });
});

describe("portfolio-data-source", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    import.meta.env.PORTFOLIO_DATA_MODE = "api-required";
    import.meta.env.PORTFOLIO_API_BASE_URL = "https://api.example.test";
    import.meta.env.PORTFOLIO_API_TOKEN = "portfolio-token";
    import.meta.env.PORTFOLIO_API_ORIGIN = "https://my.zodev.live";
    import.meta.env.PORTFOLIO_SHOWCASE_SLUG = "main-portfolio";
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("returns API data when the upstream request succeeds", async () => {
    const fetchCalls: Array<{
      url: string;
      headers: HeadersInit | undefined;
    }> = [];

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      fetchCalls.push({
        url: String(input),
        headers: init?.headers,
      });

      return new Response(
        JSON.stringify({ data: { projects: [{ slug: "api-project" }] } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const result = await fetchPortfolioApiData<AstroBootstrapPayload>({
      path: "/api/portfolio/astro/main-portfolio/bootstrap",
      requestOrigin: "https://my.zodev.live",
    });

    expect(result.resolvedSource).toBe("api");
    expect(result.data).toEqual({
      projects: [{ slug: "api-project" }],
    });
    expect(result.endpoint).toBe(
      "https://api.example.test/api/portfolio/astro/main-portfolio/bootstrap",
    );
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.headers).toEqual({
      Accept: "application/json",
      Authorization: "Bearer portfolio-token",
    });
    expect(getPortfolioSnapshotEndpoint("main-portfolio")).toBe(
      "snapshot:portfolio-snapshots/main-portfolio/latest.json",
    );
  });

  test("omits Origin on tokenized server-to-server requests", () => {
    expect(
      buildPortfolioRequestHeaders({
        apiToken: "portfolio-token",
        requestOrigin: "https://my.zodev.live",
      }),
    ).toEqual({
      Accept: "application/json",
      Authorization: "Bearer portfolio-token",
    });

    expect(
      buildPortfolioRequestHeaders({
        requestOrigin: "https://my.zodev.live",
      }),
    ).toEqual({
      Accept: "application/json",
      Origin: "https://my.zodev.live",
    });
  });

  test("falls back to the last known good snapshot when every API base fails", async () => {
    const snapshot: PortfolioSnapshotV1 = {
      version: 1,
      showcaseSlug: "main-portfolio",
      capturedAt: "2026-07-06T00:00:00.000Z",
      source: "zodback",
      reason: "scheduled-reconcile",
      upstream: {
        showcaseEndpoint: "https://api.example.test/api/portfolio/showcase/main-portfolio",
        astroBootstrapEndpoint: "https://api.example.test/api/portfolio/astro/main-portfolio/bootstrap",
      },
      payloads: {
        showcase: { hero: "from-snapshot" },
        astroBootstrap: {
          projects: [{ slug: "snapshot-project" }],
        },
      },
    };

    blobResponse = {
      statusCode: 200,
      stream: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(JSON.stringify(snapshot)),
          );
          controller.close();
        },
      }),
    };

    globalThis.fetch = async () => {
      throw new Error("ZodBack API unavailable");
    };

    const result = await fetchPortfolioApiData<AstroBootstrapPayload>({
      path: "/api/portfolio/astro/main-portfolio/bootstrap",
      requestOrigin: "https://my.zodev.live",
    });

    expect(result.resolvedSource).toBe("snapshot");
    expect(result.snapshotCapturedAt).toBe(snapshot.capturedAt);
    expect(result.endpoint).toBe(
      "snapshot:/api/portfolio/astro/main-portfolio/bootstrap",
    );
    expect(result.data).toEqual({
      projects: [{ slug: "snapshot-project" }],
    });
  });
});
