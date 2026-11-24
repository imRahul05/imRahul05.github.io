import React from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "./components/routes/Routes";
import { ElevenLabsAgent } from "./components/ElevenLabsAgent";
import { FloatingDock } from "./components/floatbuttons/FloatingDock";
import { CommandPalette } from "./components/CommandPalette";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function App() {
  const location = useLocation();

  return (
    <TooltipProvider>
      <AppRoutes />
      {location.pathname === "/" && <ElevenLabsAgent />}
      <CommandPalette />
      <FloatingDock />
    </TooltipProvider>
  );
}
