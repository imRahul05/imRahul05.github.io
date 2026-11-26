import React, { Suspense, lazy, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "./components/routes/Routes";
import { ElevenLabsAgent } from "./components/ElevenLabsAgent";
import { FloatingDock } from "./components/floatbuttons/FloatingDock";
import { TooltipProvider } from "@/components/ui/tooltip";
import { afterLoadIdle } from "./lib/idle";

// The ⌘K palette (dialog + search over all projects/blogs) isn't needed for
// first paint, so it ships as its own chunk and mounts once the page is idle.
const CommandPalette = lazy(() =>
  import("./components/CommandPalette").then((m) => ({
    default: m.CommandPalette,
  })),
);

export default function App() {
  const location = useLocation();
  const [extrasReady, setExtrasReady] = useState(false);

  useEffect(() => afterLoadIdle(() => setExtrasReady(true)), []);

  return (
    <TooltipProvider>
      <AppRoutes />
      {location.pathname === "/" && <ElevenLabsAgent />}
      {extrasReady && (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      )}
      <FloatingDock />
    </TooltipProvider>
  );
}
