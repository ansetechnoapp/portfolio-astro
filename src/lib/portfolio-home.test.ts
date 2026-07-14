import { describe, expect, test } from "bun:test";
import {
  isHomepageBetaProject,
  selectHomepageProjects,
} from "./portfolio-home";

describe("portfolio-home", () => {
  test("detects beta projects from the dedicated flag or beta tags", () => {
    expect(
      isHomepageBetaProject({
        data: {
          isBeta: true,
          tags: ["Launch"],
        },
      }),
    ).toBe(true);

    expect(
      isHomepageBetaProject({
        data: {
          isBeta: false,
          tags: ["Beta", "Showcase"],
        },
      }),
    ).toBe(true);

    expect(
      isHomepageBetaProject({
        data: {
          isBeta: false,
          tags: ["Production"],
        },
      }),
    ).toBe(false);
  });

  test("keeps only stable projects on the homepage, sorted by release order", () => {
    const projects = selectHomepageProjects([
      { data: { sortOrder: 2, isBeta: true, tags: ["Launch"] } },
      { data: { sortOrder: 8, isBeta: false, tags: ["Production"] } },
      { data: { sortOrder: 5, tags: ["Beta", "Showcase"] } },
      { data: { sortOrder: 7, isBeta: false, tags: ["Production"] } },
      { data: { sortOrder: 3, isBeta: false, tags: ["Production"] } },
    ]);

    expect(projects.map((project) => project.data.sortOrder)).toEqual([8, 7, 3]);
  });

  test("falls back to the local collection number when sortOrder is absent", () => {
    const projects = selectHomepageProjects([
      { data: { number: 1, isBeta: false, tags: ["Production"] } },
      { data: { number: 4, isBeta: false, tags: ["Production"] } },
      { data: { number: 2, isBeta: true, tags: ["Beta"] } },
      { data: { number: 5, isBeta: false, tags: ["Production"] } },
      { data: { number: 3, isBeta: false, tags: ["Production"] } },
    ]);

    expect(projects.map((project) => project.data.number)).toEqual([5, 4, 3, 1]);
  });
});
