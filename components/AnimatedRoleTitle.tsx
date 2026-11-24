import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RolePair {
  first: string;
  second: string;
}

const ROLE_SEQUENCE: ReadonlyArray<RolePair> = [
  { first: "AI", second: "Engineer" },
  { first: "Software", second: "Engineer" },
  { first: "Software", second: "Developer" },
];

const CYCLE_MS = 2600;

interface AnimatedRoleTitleProps {
  className?: string;
}

export const AnimatedRoleTitle: React.FC<AnimatedRoleTitleProps> = ({
  className,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % ROLE_SEQUENCE.length);
    }, CYCLE_MS);

    return () => window.clearInterval(timer);
  }, []);

  const current = ROLE_SEQUENCE[stepIndex];

  return (
    <p
      className={cn(
        "inline-flex items-baseline gap-1.5 font-mono text-[0.78rem] uppercase tracking-[0.07em] transition-[font-size,margin-bottom] duration-300 ease-out",
        className,
      )}
      aria-live="polite"
    >
      <span className="inline-flex overflow-hidden py-0.5 [perspective:400px]">
        <span
          key={current.first}
          className="animate-role-word font-semibold text-accent"
        >
          {current.first}
        </span>
      </span>
      <span className="inline-flex overflow-hidden py-0.5 [perspective:400px]">
        <span
          key={current.second}
          className="animate-role-word font-medium text-foreground"
        >
          {current.second}
        </span>
      </span>
    </p>
  );
};
