import { useEffect, useRef, useState } from "react";
import "../../styles.scss";
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

        // console.error("Mermaid render error:", err);
        setError("Failed to render diagram");
      }
    };

    renderDiagram();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre className="mermaid-diagram">
        <code>{chart}</code>
      </pre>
    );
  }

  return <div ref={ref} className="mermaid-diagram" />;
};
