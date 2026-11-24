import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => (
  <h2 className="text-sm font-bold uppercase tracking-[0.05em] border-b border-border pb-1 mb-6 mt-10">
    {children}
  </h2>
);
