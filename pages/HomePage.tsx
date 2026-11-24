import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  MapPin,
  Github,
  ArrowRight,
  Linkedin,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Skeleton } from "@/components/ui/skeleton";
import { DATA } from "../data/data";
import {
  ContributionGraph,
  generateContributionData,
} from "../components/ContributionGraph";
import { SectionTitle } from "../components/SectionTitle";
import { ProjectCard } from "../components/project/ProjectCard";
import { Education } from "../components/education/Education";
import { Experience } from "../components/experience/Experience";
import { SocialLink } from "../components/SocialLink";
import { DigitalClock } from "../components/DigitalClock";
import { XIcon } from "../components/XIcon";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const contributionData = React.useMemo(() => generateContributionData(), []);

  const headerRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const expandedHeightRef = useRef<number>(0);
  const scrolledRef = useRef(false);
  const lockUntilRef = useRef<number>(0);
  const unlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const thresholdsRef = {
      current: mobileQuery.matches
        ? { shrinkAt: 120, expandAt: 20 }
        : { shrinkAt: 140, expandAt: 25 },
    };

    const syncThresholds = () => {
      thresholdsRef.current = mobileQuery.matches
        ? { shrinkAt: 120, expandAt: 20 }
        : { shrinkAt: 140, expandAt: 25 };

      if (!scrolledRef.current && headerRef.current) {
        expandedHeightRef.current = headerRef.current.offsetHeight;
      }
    };

    const applyHeaderState = () => {
      rafRef.current = null;

      const header = headerRef.current;
      if (!header) return;

      const now = performance.now();
      if (now < lockUntilRef.current) {
        if (!unlockTimerRef.current) {
          unlockTimerRef.current = setTimeout(
            () => {
              unlockTimerRef.current = null;
              applyHeaderState();
            },
            Math.ceil(lockUntilRef.current - now) + 16,
          );
        }
        return;
      }

      const { shrinkAt, expandAt } = thresholdsRef.current;
      const scrollY = window.scrollY;
      const nextIsScrolled =
        scrollY > shrinkAt
          ? true
          : scrollY < expandAt
            ? false
            : scrolledRef.current;

      if (nextIsScrolled === scrolledRef.current) {
        return;
      }

      // Capture exact expanded height before collapsing so spacer compensates 1:1
      if (nextIsScrolled && !scrolledRef.current) {
        expandedHeightRef.current = header.offsetHeight;
      }

      scrolledRef.current = nextIsScrolled;
      lockUntilRef.current = now + 350;
      header.classList.toggle("is-scrolled", nextIsScrolled);

      if (spacerRef.current) {
        if (nextIsScrolled) {
          const collapsedEstimate = mobileQuery.matches ? 76 : 82;
          const delta = Math.max(
            0,
            expandedHeightRef.current - collapsedEstimate,
          );
          spacerRef.current.style.height = `${delta}px`;
        } else {
          spacerRef.current.style.height = "0px";
        }
      }
    };

    const handleScroll = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(applyHeaderState);
    };

    syncThresholds();
    applyHeaderState();

    window.addEventListener("scroll", handleScroll, { passive: true });
    mobileQuery.addEventListener("change", syncThresholds);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mobileQuery.removeEventListener("change", syncThresholds);
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      if (unlockTimerRef.current) clearTimeout(unlockTimerRef.current);
    };
  }, []);

  const featuredProjects = DATA.projects
    .filter((p) => "featured" in p && p.featured)
    .slice(0, 4);

  const handleViewAllProjects = () => {
    navigate("/projects");
    window.scrollTo(0, 0);
  };

  const handleViewBlogs = () => {
    navigate("/blogs");
    window.scrollTo(0, 0);
  };

  return (
    <div className="relative min-h-screen [overflow-anchor:none]">
      <div className="relative z-[1] max-w-[42rem] mx-auto px-6 py-16 min-h-screen">
        {/* HEADER */}
        <header
          ref={headerRef}
          className="group sticky top-0 z-50 bg-background/90 backdrop-blur-[10px] py-4 -mt-4 mb-8 flex flex-row justify-between items-start gap-6 sm:gap-8 border-b-[1.5px] border-dashed border-transparent transition-[gap,padding,border-color,background-color] duration-300 ease-out [&.is-scrolled]:items-center [&.is-scrolled]:gap-4 [&.is-scrolled]:py-2 [&.is-scrolled]:border-b-border"
        >
          <div>
            <h1 className="text-[1.5rem] mb-2 tracking-[-0.025em] transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:text-[1.1rem] group-[.is-scrolled]:mb-[0.1rem]">
              {DATA.personal.name}
            </h1>
            <p className="text-sm text-secondary-foreground mb-4 transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:text-[0.8rem] group-[.is-scrolled]:mb-[0.1rem]">
              {DATA.personal.title}
            </p>
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:mb-0 group-[.is-scrolled]:text-xs">
              <MapPin size={14} className="text-foreground" />
              {DATA.personal.location}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 transition-[font-size,margin-bottom,opacity] duration-300 ease-out group-[.is-scrolled]:hidden">
              <span className="w-2 h-2 rounded-full bg-foreground animate-pulse-glow shrink-0" />
              <span>
                Building{" "}
                <HoverCard>
                  <HoverCardTrigger
                    href={DATA.personal.currentlyBuilding.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-bold tracking-[0.02em] cursor-pointer underline decoration-dashed decoration-foreground/70 underline-offset-[4px] relative transition-opacity duration-200 ease-out hover:opacity-75"
                  >
                    {DATA.personal.currentlyBuilding.name}
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    side="bottom"
                    sideOffset={12}
                    className="w-auto p-0 bg-transparent border-0 shadow-none ring-0"
                  >
                    <img
                      src={DATA.personal.currentlyBuilding.previewImage}
                      alt={DATA.personal.currentlyBuilding.name}
                      className="pencil-box w-[280px] max-w-[80vw] bg-background grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </HoverCardContent>
                </HoverCard>
              </span>
            </div>
          </div>

          <div className="relative inline-grid place-items-center shrink-0 rounded-full profile-aura-ring">
            <div
              className={cn(
                "relative w-24 h-24 sm:w-32 sm:h-32 flip-3d z-[1] transition-[width,height] duration-300 ease-out group-[.is-scrolled]:w-14 group-[.is-scrolled]:h-14",
                isImageLoaded && isVideoReady && "animate-coin-flip",
              )}
            >
              {/* Front Side - Profile Image */}
              <div className="absolute w-full h-full flip-backface-hidden rounded-full overflow-hidden z-[2]">
                {!isImageLoaded && (
                  <Skeleton className="w-full h-full rounded-full animate-shimmer bg-transparent" />
                )}
                <img
                  src={DATA.personal.image}
                  alt={DATA.personal.name}
                  className={cn(
                    "w-full h-full object-cover border border-foreground rounded-full shrink-0 transition-[width,height] duration-300 ease-out dark:grayscale",
                    !isImageLoaded && "hidden",
                  )}
                  onLoad={() => setIsImageLoaded(true)}
                />
              </div>
              {/* Back Side - Video */}
              <div className="absolute w-full h-full flip-backface-hidden flip-rotate-y-180 rounded-full overflow-hidden">
                <video
                  className="w-full h-full object-cover rounded-full border border-foreground transition-[width,height] duration-300 ease-out"
                  src={DATA.personal.profileVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  onCanPlayThrough={() => setIsVideoReady(true)}
                />
              </div>
            </div>
          </div>
        </header>
        <div
          ref={spacerRef}
          aria-hidden="true"
          className="h-0 transition-[height] duration-300 ease-out"
        />

        {/* BIO */}
        <section className="mb-12">
          <p className="text-sm leading-relaxed text-secondary-foreground max-w-[400px]">
            {DATA.personal.bio}
          </p>
        </section>

        {/* SKILLS (Badges Style) */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-2 text-xs">
            {DATA.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="pencil-badge h-auto bg-card px-2.5 py-1 text-xs font-normal text-foreground"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </section>

        {/* EXPERIENCE */}
        <Experience />

        {/* EDUCATION */}
        <Education />

        {/* FEATURED PROJECTS */}
        <section className="mb-12">
          <SectionTitle>Featured Projects</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.name} {...project} />
            ))}
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              type="button"
              className="pencil-btn inline-flex items-center gap-2 px-5 py-3 bg-card text-foreground font-mono text-[0.8rem] font-semibold tracking-[0.05em] uppercase cursor-pointer hover:bg-foreground hover:text-background"
              onClick={handleViewAllProjects}
            >
              View All Projects ({DATA.projects.length})
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="pencil-btn inline-flex items-center gap-2 px-5 py-3 bg-card text-foreground font-mono text-[0.8rem] font-semibold tracking-[0.05em] uppercase cursor-pointer hover:bg-foreground hover:text-background"
              onClick={handleViewBlogs}
            >
              <BookOpen size={16} />
              Read Blog
            </button>
          </div>
        </section>

        {/* CONTRIBUTION GRAPH */}
        <section className="mb-12">
          <SectionTitle>Build Rhythm</SectionTitle>
          <ContributionGraph
            className="pencil-box relative overflow-hidden bg-card p-4"
            data={contributionData}
          />
        </section>

        {/* FOOTER */}
        <footer className="mt-20 border-t-[1.5px] border-dashed border-border pt-8 pb-16">
          <div className="flex flex-row flex-wrap items-center gap-4 sm:gap-8">
            <SocialLink
              href={`mailto:${DATA.personal.email}`}
              icon={Mail}
              label="Email"
            />
            <SocialLink
              href={`https://${DATA.personal.github}`}
              icon={Github}
              label="GitHub"
            />
            <SocialLink
              href={`https://${DATA.personal.linkedin}`}
              icon={Linkedin}
              label="LinkedIn"
            />
            <SocialLink
              href={`https://${DATA.personal.X}`}
              icon={XIcon}
              label="X"
            />
            <div className="ml-auto">
              <DigitalClock />
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {DATA.personal.name}. Built with React,
            TypeScript, Tailwind CSS, and Base UI.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
