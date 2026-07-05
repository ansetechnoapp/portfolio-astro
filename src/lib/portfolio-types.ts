export type AstroBootstrapProject = {
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

export type AstroBootstrapPayload = {
  user?: Record<string, unknown>;
  timelineEvents?: Array<Record<string, unknown>>;
  projects?: AstroBootstrapProject[];
};
