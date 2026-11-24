import { useEffect, useRef, useState } from "react";
import React from "react";

let mermaidInitialized = false;

interface Props {
  chart: string;
}

export const MermaidDiagram: React.FC<Props> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderDiagram = async () => {
      if (!ref.current) return;

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

        if (ref.current) {
          ref.current.innerHTML = svg;
        }
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
  }, [chart]);

  const containerClasses =
    "my-8 flex justify-start sm:justify-center overflow-x-auto rounded-lg border border-border bg-background p-4 sm:p-6 [&_svg]:h-auto [&_svg]:min-w-[300px] [&_svg]:max-w-none sm:[&_svg]:max-w-full";

  if (error) {
    return (
      <pre className={containerClasses}>
        <code className="font-mono text-sm text-foreground">{chart}</code>
      </pre>
    );
  }

  return <div ref={ref} className={containerClasses} />;
};
