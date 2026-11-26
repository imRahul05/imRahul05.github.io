import React, { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

let mermaidInitialized = false;

interface Props {
  chart: string;
}

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export const MermaidDiagram: React.FC<Props> = ({ chart }) => {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Mermaid (and its ~400ms render on mid-range phones) is only fetched and
  // run once the diagram is about to scroll into view.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNear, setIsNear] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (isNear) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isNear]);

  useEffect(() => {
    if (!isNear) return;
    let cancelled = false;

    const renderDiagram = async () => {
      const id = "mermaid-" + Math.random().toString(36).slice(2);

      try {
        const { default: mermaid } = await import("mermaid");

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "default",
            securityLevel: "loose",
          });
          mermaidInitialized = true;
        }

        const { svg } = await mermaid.render(id, chart);

        if (cancelled) {
          return;
        }

        setSvgMarkup(svg);
        setError(null);
      } catch {
        if (cancelled) {
          return;
        }

        // mermaid.render creates a temp element with the id on failure; clean it up
        const tempEl = document.getElementById(id);
        if (tempEl) tempEl.remove();

        setError("Failed to render diagram");
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart, isNear]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setZoom(1);
    }
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
  }, []);

  if (error) {
    return (
      <pre className="my-8 overflow-x-auto rounded-lg border border-border bg-background p-4 sm:p-6">
        <code className="font-mono text-sm text-foreground">{chart}</code>
      </pre>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="group relative my-8 rounded-xl border border-border bg-background transition-colors hover:border-muted-foreground/60"
      >
        {/* Top-right expand button (diagonal two-arrow icon) */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Expand diagram"
          title="Expand diagram"
          className="absolute top-2.5 right-2.5 z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/90 px-2.5 py-1.5 font-mono text-[0.68rem] font-medium text-secondary-foreground shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-foreground/40 hover:bg-border-light hover:text-foreground"
        >
          <Maximize2 size={13} />
          <span className="hidden sm:inline">Expand</span>
        </button>

        {/* Inline diagram canvas */}
        <div
          onClick={() => setIsOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          aria-label="Click to expand diagram"
          className="flex cursor-zoom-in justify-start overflow-x-auto p-4 pt-12 sm:justify-center sm:p-6 sm:pt-12 [&_svg]:h-auto [&_svg]:max-w-none [&_svg]:min-w-[300px] sm:[&_svg]:max-w-full"
          dangerouslySetInnerHTML={
            svgMarkup ? { __html: svgMarkup } : undefined
          }
        />
      </div>

      {/* Fullscreen Expandable Diagram Popup (Base UI Dialog) */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="fixed top-1/2 left-1/2 z-[1000] flex max-h-[90vh] w-[94vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-2xl sm:max-w-6xl"
        >
          {/* Popup Toolbar */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-border-light/40 px-4 py-3">
            <DialogHeader className="gap-0">
              <DialogTitle className="font-mono text-xs font-semibold tracking-wider uppercase text-secondary-foreground">
                Architecture Diagram
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                title="Zoom out"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-secondary-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomOut size={15} />
              </button>
              <span className="min-w-[4ch] text-center font-mono text-xs text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                title="Zoom in"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-secondary-foreground transition-colors hover:border-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ZoomIn size={15} />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                aria-label="Reset zoom"
                title="Reset zoom"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-secondary-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={14} />
              </button>
              <DialogClose
                aria-label="Close diagram"
                className="ml-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-secondary-foreground transition-colors hover:border-foreground/40 hover:bg-border-light hover:text-foreground"
              >
                <X size={16} />
              </DialogClose>
            </div>
          </div>

          {/* Scrollable Zoomable Diagram Stage */}
          <div className="flex flex-1 items-center justify-center overflow-auto bg-background p-6 sm:p-10">
            <div
              className="origin-center transition-transform duration-200 ease-out [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:w-full"
              style={{
                transform: `scale(${zoom})`,
                width: "min(100%, 1040px)",
              }}
              dangerouslySetInnerHTML={
                svgMarkup ? { __html: svgMarkup } : undefined
              }
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
