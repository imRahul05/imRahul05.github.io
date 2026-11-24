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
  const scrolledRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const thresholdsRef = {
      current: mobileQuery.matches
        ? { shrinkAt: 80, expandAt: 10 }
        : { shrinkAt: 120, expandAt: 60 },
    };

    const syncThresholds = () => {
      thresholdsRef.current = mobileQuery.matches
        ? { shrinkAt: 80, expandAt: 10 }
        : { shrinkAt: 120, expandAt: 60 };
    };

    const applyHeaderState = () => {
      rafRef.current = null;

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

      scrolledRef.current = nextIsScrolled;
      headerRef.current?.classList.toggle("is-scrolled", nextIsScrolled);
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
    };
  }, []);

  const featuredProjects = DATA.projects.filter((p) => p.image).slice(0, 2);

  const handleViewAllProjects = () => {
    navigate("/projects");
    window.scrollTo(0, 0);
  };

  const handleViewBlogs = () => {
    navigate("/blogs");
    window.scrollTo(0, 0);
  };

  return (
    <div className="relative min-h-screen">
      <div className="relative z-[1] max-w-[42rem] mx-auto px-6 py-16 min-h-screen">
        {/* HEADER */}
        <header
          ref={headerRef}
          className="group sticky top-0 z-50 bg-background/90 backdrop-blur-[10px] py-4 -mt-4 mb-8 flex flex-col-reverse sm:flex-row justify-between items-start gap-8 border-b border-transparent transition-[gap,padding,border-color,align-items,background-color] duration-300 ease-out [&.is-scrolled]:flex-row [&.is-scrolled]:items-center [&.is-scrolled]:gap-4 [&.is-scrolled]:py-2 [&.is-scrolled]:border-b-border-light"
        >
          <div>
            <h1 className="text-[1.5rem] mb-2 tracking-[-0.025em] transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:text-[1.1rem] group-[.is-scrolled]:mb-[0.1rem]">
              {DATA.personal.name}
            </h1>
            <p className="text-sm text-secondary-foreground mb-4 transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:text-[0.8rem] group-[.is-scrolled]:mb-[0.1rem]">
              {DATA.personal.title}
            </p>
            <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground transition-[font-size,margin-bottom] duration-300 ease-out group-[.is-scrolled]:mb-0 group-[.is-scrolled]:text-xs">
              <MapPin size={14} className="text-[#3b82f6]" />
              {DATA.personal.location}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4 transition-[font-size,margin-bottom,opacity] duration-300 ease-out group-[.is-scrolled]:hidden">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse-glow shrink-0" />
              <span>
                Building{" "}
                <HoverCard>
                  <HoverCardTrigger
                    href={DATA.personal.currentlyBuilding.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[linear-gradient(135deg,#4c2354_0%,#818cf8_50%,#61546d_100%)] bg-clip-text text-transparent font-bold tracking-[0.02em] cursor-pointer no-underline relative transition-opacity duration-200 ease-out hover:opacity-80 hover:underline hover:decoration-[#818cf8] hover:underline-offset-[3px]"
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
                      className="w-[280px] max-w-[80vw] rounded-lg border border-border shadow-[0_10px_40px_rgba(0,0,0,0.3)] bg-background"
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
                className="rounded-none h-auto px-1.5 py-0.5 text-xs font-normal text-secondary-foreground border-border"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {featuredProjects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
          <div className="flex gap-4 flex-wrap">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-border rounded-lg text-secondary-foreground font-mono text-[0.8rem] font-medium tracking-[0.05em] uppercase cursor-pointer transition-[background-color,border-color,color,box-shadow] duration-200 ease-out hover:bg-white/10 hover:border-[rgba(80,200,120,0.5)] hover:text-foreground hover:shadow-[0_0_15px_rgba(80,200,120,0.1)]"
              onClick={handleViewAllProjects}
            >
              View All Projects
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/5 border border-border rounded-lg text-secondary-foreground font-mono text-[0.8rem] font-medium tracking-[0.05em] uppercase cursor-pointer transition-[background-color,border-color,color,box-shadow] duration-200 ease-out hover:bg-white/10 hover:border-[rgba(80,200,120,0.5)] hover:text-foreground hover:shadow-[0_0_15px_rgba(80,200,120,0.1)]"
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
            className="relative overflow-hidden border border-[rgba(155,92,255,0.16)] dark:border-[rgba(255,126,76,0.18)] rounded-2xl p-4 bg-[radial-gradient(circle_at_top_left,rgba(255,111,55,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(80,200,120,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,245,255,0.92))] dark:bg-[radial-gradient(circle_at_top_left,rgba(255,111,55,0.2),transparent_34%),radial-gradient(circle_at_top_right,rgba(81,170,180,0.16),transparent_30%),linear-gradient(180deg,rgba(17,16,24,0.98),rgba(12,10,16,0.95))] shadow-[0_18px_40px_rgba(35,20,58,0.08),inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[0_24px_50px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,214,179,0.08)]"
            data={contributionData}
          />
        </section>

        {/* FOOTER */}
        <footer className="mt-20 border-t border-border-light pt-8 pb-16">
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
