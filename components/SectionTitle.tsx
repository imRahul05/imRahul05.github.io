import React from "react";

interface SectionTitleProps {
  children: React.ReactNode;
  index?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  index,
}) => (
  <div className="section-rule mt-12 mb-6 flex items-center justify-between border-b border-border pb-2.5">
    <h2 className="flex items-center gap-2.5 font-mono text-[0.72rem] font-medium tracking-[0.09em] uppercase text-foreground">
      {index && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center bg-foreground px-1 font-mono text-[0.625rem] font-semibold tabular-nums text-background">
          {index}
        </span>
      )}
      <span>{children}</span>
    </h2>
    <span aria-hidden="true" className="h-1.5 w-1.5 bg-accent/80" />
  </div>
);
