type HomepageProjectLike = {
  data: {
    number?: number | null;
    sortOrder?: number | null;
    tags?: string[] | null;
    isBeta?: boolean | null;
  };
};

function hasBetaTag(tags?: string[] | null): boolean {
  return Array.isArray(tags) && tags.some((tag) => /beta/i.test(tag));
}

function getHomepageProjectOrder(project: HomepageProjectLike): number {
  const rawOrder = project.data.sortOrder ?? project.data.number ?? 0;
  const order = Number(rawOrder);
  return Number.isFinite(order) ? order : 0;
}

export function isHomepageBetaProject(project: HomepageProjectLike): boolean {
  return Boolean(project.data.isBeta || hasBetaTag(project.data.tags));
}

export function selectHomepageProjects<T extends HomepageProjectLike>(
  projects: T[],
  limit = 4,
): T[] {
  return projects
    .slice()
    .filter((project) => !isHomepageBetaProject(project))
    .sort((a, b) => getHomepageProjectOrder(b) - getHomepageProjectOrder(a))
    .slice(0, limit);
}
