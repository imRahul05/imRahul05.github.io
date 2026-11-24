import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Github, Layers } from "lucide-react";
import { DATA, type ProjectData } from "../data/data";
import { ProjectCard } from "../components/project/ProjectCard";
import { ProjectItem } from "../components/project/ProjectItem";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ProjectFilter = "all" | "featured" | "live" | "opensource";

const FILTER_OPTIONS: ReadonlyArray<{ id: ProjectFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "featured", label: "Featured" },
  { id: "live", label: "Live Deployed" },
  { id: "opensource", label: "Open Source" },
];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>("all");

  const allProjects: ProjectData[] = DATA.projects;

  const stats = useMemo(() => {
    const liveCount = allProjects.filter((p) => Boolean(p.link)).length;
    const repoCount = allProjects.filter((p) => Boolean(p.sourceUrl)).length;
    const featuredCount = allProjects.filter((p) => Boolean(p.featured)).length;
    return {
      total: allProjects.length,
      liveCount,
      repoCount,
      featuredCount,
    };
  }, [allProjects]);

  const filteredProjects = useMemo(() => {
    switch (activeFilter) {
      case "featured":
        return allProjects.filter((p) => Boolean(p.featured));
      case "live":
        return allProjects.filter((p) => Boolean(p.link));
      case "opensource":
        return allProjects.filter((p) => Boolean(p.sourceUrl));
      case "all":
      default:
        return allProjects;
    }
  }, [allProjects, activeFilter]);

  const showcaseProjects = useMemo(
    () =>
      filteredProjects.filter((p) => Boolean(p.featured) || Boolean(p.image)),
    [filteredProjects],
  );

  const archiveProjects = useMemo(() => {
    const showcaseNames = new Set(showcaseProjects.map((p) => p.name));
    return filteredProjects.filter((p) => !showcaseNames.has(p.name));
  }, [filteredProjects, showcaseProjects]);

  const handleBackClick = () => {
    navigate("/");
    window.scrollTo(0, 0);
  };

  const getFilterCount = (id: ProjectFilter): number => {
    switch (id) {
      case "featured":
        return stats.featuredCount;
      case "live":
        return stats.liveCount;
      case "opensource":
        return stats.repoCount;
      case "all":
      default:
        return stats.total;
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-6 pt-14 pb-28 font-mono">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-6">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 self-start py-1 font-mono text-sm text-secondary-foreground transition-colors duration-200 hover:text-foreground"
          onClick={handleBackClick}
          aria-label="Go back to home"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Projects
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              Production apps, AI tooling, and experiments — with live links and
              source repositories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground">
            <Badge
              variant="outline"
              className="h-auto gap-1.5 rounded-md border-border bg-transparent px-2.5 py-1 font-normal text-secondary-foreground"
            >
              <Layers size={12} />
              {stats.total} total
            </Badge>
            <Badge
              variant="outline"
              className="h-auto gap-1.5 rounded-md border-border bg-transparent px-2.5 py-1 font-normal text-secondary-foreground"
            >
              <ExternalLink size={12} />
              {stats.liveCount} live
            </Badge>
            <Badge
              variant="outline"
              className="h-auto gap-1.5 rounded-md border-border bg-transparent px-2.5 py-1 font-normal text-secondary-foreground"
            >
              <Github size={12} />
              {stats.repoCount} repos
            </Badge>
          </div>
        </div>

        {/* Filter Pills */}
        <div
          className="flex flex-wrap items-center gap-2 pt-1"
          role="tablist"
          aria-label="Filter projects"
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeFilter === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(option.id)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors duration-200",
                  isActive
                    ? "border-foreground bg-foreground font-semibold text-background"
                    : "border-border bg-transparent text-secondary-foreground hover:border-muted-foreground hover:bg-border-light hover:text-foreground",
                )}
              >
                <span>{option.label}</span>
                <span
                  className={cn(
                    "text-[0.65rem]",
                    isActive ? "text-background/75" : "text-muted-foreground",
                  )}
                >
                  {getFilterCount(option.id)}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Flagship Visual Grid */}
      {showcaseProjects.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold tracking-[0.1em] uppercase text-muted-foreground">
              Featured &amp; Visual Builds
            </h2>
            <span className="text-[0.7rem] text-muted-foreground">
              {showcaseProjects.length}{" "}
              {showcaseProjects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {showcaseProjects.map((project) => (
              <ProjectCard key={project.name} {...project} />
            ))}
          </div>
        </section>
      )}

      {/* More Projects & Experiments */}
      {archiveProjects.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between border-t border-border-light pt-8">
            <h2 className="text-xs font-bold tracking-[0.1em] uppercase text-muted-foreground">
              More Projects &amp; Experiments
            </h2>
            <span className="text-[0.7rem] text-muted-foreground">
              {archiveProjects.length}{" "}
              {archiveProjects.length === 1 ? "project" : "projects"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {archiveProjects.map((project) => (
              <ProjectItem key={project.name} {...project} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProjectsPage;
