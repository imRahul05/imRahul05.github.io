import React, { useEffect, useState } from "react";
import { X, Phone } from "lucide-react";

export function ElevenLabsAgent() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 768px)").matches;
  });

  useEffect(() => {
    if (dismissed) return;

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [dismissed]);

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        aria-label="Talk to AI"
        className="liquid-glass liquid-rim fixed right-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+76px)] z-[10000] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-0 p-0 text-foreground sm:right-5 sm:bottom-5"
      >
        <Phone size={20} />
      </button>
    );
  }

  return (
    <>
      <elevenlabs-convai
        agent-id="agent_5701kh7y1pasfv5tee9yfnx2z0gf"
        action-text="Wanna call?"
        start-call-text="Start talking"
      />

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Close AI agent"
        className="fixed right-2 bottom-[68px] z-[10000] flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-background p-0 text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
      >
        <X size={14} />
      </button>
    </>
  );
}
