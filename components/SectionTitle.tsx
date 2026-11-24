import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => (
  <h2 className="mt-10 mb-6 border-b-[1.5px] border-dashed border-border pb-1.5 text-sm font-bold tracking-[0.06em] uppercase text-foreground">
    {children}
  </h2>
);
