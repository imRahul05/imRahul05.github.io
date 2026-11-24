import React, { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { DATA } from "../../data/data";
import { ProjectItem } from "./ProjectItem";

interface ProjectsPageProps {
  onBack: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onBack }) => {
  const handleBackClick = useCallback(() => {
    onBack();
  }, [onBack]);

  const pinnedTopOrder = [
    "MarkDown Previewer",
    "FinSage AI",
    "School Management System",
    "PillPal AI",
    "Movie Stream",
    "Billing and Management App",
    "Community Care",
  ] as const;

  const smallProjectsOrder = [
    "SnapDigest",
    "TypeFast - Competitive Typing Speed Game",
  ] as const;

  const pinnedTopProjects = pinnedTopOrder
    .map((name) => DATA.projects.find((p) => p.name === name))
    .filter(Boolean);

  const smallProjects = smallProjectsOrder
    .map((name) => DATA.projects.find((p) => p.name === name))
    .filter(Boolean);

  const excludedNames = new Set<string>([
    ...pinnedTopOrder,
    ...smallProjectsOrder,
  ]);

  const remainingProjects = DATA.projects.filter(
    (p) => !excludedNames.has(p.name),
  );

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 pt-16 pb-24 font-mono">
      <header className="mb-8 flex flex-col gap-4 border-b border-border pb-4">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 self-start py-2 font-mono text-sm text-secondary-foreground transition-colors duration-200 hover:text-foreground"
          onClick={handleBackClick}
          aria-label="Go back to home"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          All Projects
        </h1>
      </header>

      <section className="mb-12">
        <div className="flex flex-col gap-6">
          {pinnedTopProjects.map((project) => (
            <ProjectItem key={project!.name} {...project!} />
          ))}

          {pinnedTopProjects.length > 0 && smallProjects.length > 0 && (
            <hr className="my-1 w-full border-0 border-t border-border" />
          )}

          {smallProjects.length > 0 && (
            <div className="mt-1 text-xs font-normal tracking-[0.08em] uppercase text-muted-foreground">
              Small Projects
            </div>
          )}

          {smallProjects.map((project) => (
            <ProjectItem key={project!.name} {...project!} />
          ))}

          {remainingProjects.map((project, index) => (
            <ProjectItem key={`${project.name}-${index}`} {...project} />
          ))}
        </div>
      </section>
    </div>
  );
};
