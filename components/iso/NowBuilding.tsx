import React, { useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "../SectionTitle";
import { LazyWhenVisible } from "../LazyWhenVisible";

// The isometric renderer is its own chunk, fetched when the section is near.
const ClaimsFoundry = React.lazy(() => import("./ClaimsFoundry"));
import { STATIONS } from "./isoScene";

const STORAGE_KEY = "now-building:collapsed";
const CLOSE_MS = 420;

const readCollapsed = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * "01 · Now Building" — collapsible wrapper around the isometric diorama.
 * The diorama is unmounted once collapsed, so its render loop fully stops.
 */
export const NowBuilding: React.FC = () => {
  const bodyId = useId();
  const [expanded, setExpanded] = useState(() => !readCollapsed());
  // Keep the diorama mounted while the close animation runs
  const [mounted, setMounted] = useState(expanded);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, expanded ? "0" : "1");
    } catch {
      /* storage unavailable — preference just isn't remembered */
    }
    if (expanded) {
      setMounted(true);
      return;
    }
    const id = window.setTimeout(() => setMounted(false), CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [expanded]);

  const toggle = () => setExpanded((v) => !v);

  return (
    <>
      <SectionTitle
        index="01"
        trailing={
          <button
            type="button"
            onClick={toggle}
            aria-expanded={expanded}
            aria-controls={bodyId}
            className="group/toggle inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-mono text-[0.62rem] font-medium tracking-[0.1em] text-muted-foreground uppercase transition-colors hover:text-accent focus-visible:text-accent focus-visible:outline-none"
          >
            <span>{expanded ? "Collapse" : "Expand"}</span>
            <span className="grid h-5 w-5 place-items-center border border-border transition-colors group-hover/toggle:border-accent">
              <ChevronDown
                size={12}
                className={cn(
                  "transition-transform duration-300 ease-out",
                  expanded && "rotate-180",
                )}
              />
            </span>
          </button>
        }
      >
        Now Building
      </SectionTitle>

      {/* Collapsed summary — also a way to expand */}
      {!expanded && (
        <button
          type="button"
          onClick={toggle}
          aria-controls={bodyId}
          aria-expanded={false}
          className="cad-card flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="min-w-0">
            <span className="block font-mono text-[0.62rem] tracking-[0.1em] text-muted-foreground uppercase">
              Fig. 01<span className="hidden sm:inline"> — Claims Foundry</span>{" "}
              · {STATIONS.length} stations
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-y-0.5 font-mono text-[0.72rem] leading-[1.5] text-foreground">
              {STATIONS.map((s, i) => (
                <React.Fragment key={s.id}>
                  {i > 0 && <span className="px-1 text-accent">→</span>}
                  <span className="whitespace-nowrap">{s.name}</span>
                </React.Fragment>
              ))}
            </span>
          </span>
          <span className="shrink-0 font-mono text-[0.62rem] tracking-[0.1em] text-accent uppercase">
            View 3D ▾
          </span>
        </button>
      )}

      <div
        id={bodyId}
        className={cn(
          "grid motion-safe:transition-[grid-template-rows,opacity] motion-safe:duration-[420ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
        inert={!expanded}
      >
        <div className="min-h-0 overflow-hidden">
          {mounted && (
            <>
              <p className="mb-4 max-w-[560px] text-[0.9rem] leading-[1.65] text-secondary-foreground">
                An isometric sketch of the AI medical-coding &amp; claims
                workflow I&apos;m building — the model suggests, deterministic
                code decides.
              </p>
              <LazyWhenVisible placeholderClassName="h-[360px] w-full sm:h-[500px]">
                <ClaimsFoundry />
              </LazyWhenVisible>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default NowBuilding;
