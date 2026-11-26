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
import { AnimatedRoleTitle } from "../components/AnimatedRoleTitle";
import { OrreryCanvas } from "../components/blueprint/OrreryCanvas";
import {
  ViewportBackChrome,
  ViewportFrontChrome,
} from "../components/blueprint/ViewportChrome";
import { ScrambleText } from "../components/blueprint/ScrambleText";
import { DimensionLine } from "../components/blueprint/DimensionLine";
import { focusOrreryBody } from "../components/blueprint/orreryState";
import { useReveal } from "../components/blueprint/useReveal";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasFlippedManually, setHasFlippedManually] = useState(false);
  const [isShowingVideo, setIsShowingVideo] = useState(false);
  const profileVideoRef = useRef<HTMLVideoElement | null>(null);
  const contributionData = React.useMemo(() => generateContributionData(), []);
  useReveal();

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

  const handleProfileToggle = () => {
    setHasFlippedManually(true);
    setIsShowingVideo((prev) => {
      const next = !prev;
      const videoEl = profileVideoRef.current;
      if (videoEl) {
        if (next) {
          videoEl.currentTime = 0;
          videoEl.play().catch(() => undefined);
        } else {
          videoEl.pause();
        }
      }
      return next;
    });
  };

  return (
    <div className="relative min-h-screen [overflow-anchor:none]">
      {/* 3D wireframe orrery + design-tool viewport chrome */}
      <OrreryCanvas className="orrery-enter pointer-events-none fixed inset-0 z-0" />
      <ViewportBackChrome />
      <ViewportFrontChrome />

      <div className="blueprint-sheet relative z-[1] mx-auto min-h-screen max-w-[44rem] px-6 py-16 sm:my-10 sm:px-10 lg:max-w-[48rem] lg:px-14">
        {/* Registration marks + sheet caption */}
        <span aria-hidden="true" className="reg-mark -top-[7px] -left-[7px]" />
        <span aria-hidden="true" className="reg-mark -top-[7px] -right-[7px]" />
        <span
          aria-hidden="true"
          className="reg-mark -bottom-[7px] -left-[7px]"
        />
        <span
          aria-hidden="true"
          className="reg-mark -right-[7px] -bottom-[7px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-0 left-0 hidden items-center justify-between font-mono text-[0.58rem] tracking-[0.1em] text-muted-foreground uppercase sm:flex"
        >
          <span>Sheet 01 — rahul_kumar.portfolio</span>
          <span>Scale 1:1 · Units px</span>
        </div>

        {/* HEADER */}
        <header
          ref={headerRef}
          className="group sticky top-0 z-50 lg:top-4 bg-background/92 backdrop-blur-[12px] py-4 -mt-4 mb-8 flex flex-row justify-between items-start gap-6 sm:gap-8 border-b border-transparent transition-[gap,padding,border-color,background-color] duration-300 ease-out [&.is-scrolled]:items-center [&.is-scrolled]:gap-4 [&.is-scrolled]:py-2.5 [&.is-scrolled]:border-b-border"
        >
          <div>
            <div className="w-fit">
              <h1 className="font-sans text-[2.1rem] sm:text-[2.6rem] font-semibold mb-1 tracking-[-0.045em] leading-[1.05] transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:text-[1.15rem] group-[.is-scrolled]:mb-[0.1rem]">
                <ScrambleText text={DATA.personal.name} />
              </h1>
              <DimensionLine className="mb-2.5 group-[.is-scrolled]:hidden" />
            </div>
            <AnimatedRoleTitle className="mb-3.5 group-[.is-scrolled]:text-[0.68rem] group-[.is-scrolled]:mb-[0.15rem]" />
            <div className="flex items-center gap-1.5 mb-2 font-mono text-[0.72rem] text-muted-foreground transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:mb-0 group-[.is-scrolled]:text-[0.68rem]">
              <MapPin size={13} className="text-accent" />
              {DATA.personal.location}
            </div>
            <div className="flex items-center gap-2 font-mono text-[0.72rem] text-muted-foreground mb-4 transition-[font-size,margin-bottom,opacity] duration-300 ease-out group-[.is-scrolled]:hidden">
              <span className="w-2 h-2 bg-accent animate-pulse-glow shrink-0" />
              <span>
                Building{" "}
                <HoverCard>
                  <HoverCardTrigger
                    href={DATA.personal.currentlyBuilding.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-medium tracking-[0.01em] cursor-pointer underline decoration-accent decoration-1 underline-offset-[4px] relative transition-colors duration-200 ease-out hover:text-accent"
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
                      className="w-[280px] max-w-[80vw] border border-border bg-card"
                    />
                  </HoverCardContent>
                </HoverCard>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleProfileToggle}
            aria-label={
              isShowingVideo
                ? "Switch profile avatar to photo"
                : "Switch profile avatar to video"
            }
            title={
              isShowingVideo
                ? "Click to show photo"
                : "Click to play profile video"
            }
            className="relative inline-grid place-items-center shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0 outline-none profile-aura-ring focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div
              className={cn(
                "relative w-24 h-24 sm:w-32 sm:h-32 flip-3d z-[1] transition-[width,height,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-[.is-scrolled]:w-14 group-[.is-scrolled]:h-14",
                !hasFlippedManually &&
                  isImageLoaded &&
                  isVideoReady &&
                  "animate-coin-flip",
                hasFlippedManually && isShowingVideo && "flip-rotate-y-180",
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
                  ref={profileVideoRef}
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
          </button>
        </header>
        <div
          ref={spacerRef}
          aria-hidden="true"
          className="h-0 transition-[height] duration-300 ease-out"
        />

        {/* BIO */}
        <section
          className="mb-12"
          data-reveal
          data-hud-section="Hero"
          data-hud-index="00"
        >
          <p className="max-w-[560px] text-[1.02rem] leading-[1.75] text-foreground/85">
            {DATA.personal.bio}
          </p>
        </section>

        {/* SKILLS (CAD Micro-Chips) — each one is a body in the orrery */}
        <section
          className="mb-12"
          data-reveal
          data-hud-section="Stack"
          data-hud-index="00"
        >
          <p className="mb-2.5 font-mono text-[0.62rem] tracking-[0.1em] text-muted-foreground uppercase">
            <span className="text-accent">◎</span> Stack in orbit — hover or tap
            to locate
          </p>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {DATA.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                tabIndex={0}
                onMouseEnter={() => focusOrreryBody(skill)}
                onMouseLeave={() => focusOrreryBody(null)}
                onFocus={() => focusOrreryBody(skill)}
                onBlur={() => focusOrreryBody(null)}
                className="cad-chip cad-chip-orbit h-auto cursor-crosshair bg-card px-2.5 py-1 text-[0.72rem] font-normal text-secondary-foreground"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </section>

        {/* EXPERIENCE */}
        <div data-reveal data-hud-section="Experience" data-hud-index="01">
          <Experience />
        </div>

        {/* EDUCATION */}
        <div data-reveal data-hud-section="Education" data-hud-index="02">
          <Education />
        </div>

        {/* FEATURED PROJECTS */}
        <section
          className="mb-12"
          data-reveal
          data-hud-section="Projects"
          data-hud-index="03"
        >
          <SectionTitle index="03">Featured Projects</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.name} {...project} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              className="cad-btn inline-flex items-center justify-between px-5 py-3.5 bg-foreground text-background font-mono text-[0.75rem] font-medium tracking-[0.06em] uppercase cursor-pointer hover:opacity-88"
              onClick={handleViewAllProjects}
            >
              <span>View All Projects ({DATA.projects.length})</span>
              <ArrowRight size={15} />
            </button>
            <button
              type="button"
              className="cad-btn-blue inline-flex items-center justify-between px-5 py-3.5 font-mono text-[0.75rem] font-medium tracking-[0.06em] uppercase cursor-pointer"
              onClick={handleViewBlogs}
            >
              <span>Read Architecture Blogs</span>
              <BookOpen size={15} />
            </button>
          </div>
        </section>

        {/* CONTRIBUTION GRAPH */}
        <section
          className="mb-12"
          data-reveal
          data-hud-section="Build Rhythm"
          data-hud-index="04"
        >
          <SectionTitle index="04">Build Rhythm</SectionTitle>
          <ContributionGraph
            className="cad-card relative overflow-hidden p-4"
            data={contributionData}
          />
        </section>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-border pt-8 pb-16">
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
          {/* Drawing title block */}
          <dl className="mt-8 grid grid-cols-2 border-t border-l border-border font-mono text-[0.62rem] tracking-[0.06em] uppercase sm:grid-cols-4">
            {[
              ["Drawn by", DATA.personal.name],
              ["Location", "12.97°N 77.59°E"],
              ["Sheet", "01 of 01"],
              [
                "Rev",
                `${new Date().getFullYear()}.${String(new Date().getMonth() + 1).padStart(2, "0")}`,
              ],
            ].map(([label, value]) => (
              <div
                key={label}
                className="border-r border-b border-border px-3 py-2"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="m-0 text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {DATA.personal.name}. Built with React,
            TypeScript, Tailwind CSS, Base UI — and a hand-rolled 3D canvas
            orrery.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
