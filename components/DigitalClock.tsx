import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface TimeState {
  hours: string;
  minutes: string;
  seconds: string;
}

interface DigitalClockProps {
  className?: string;
}

function getISTTime(): TimeState {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(utc + istOffset);

  return {
    hours: ist.getHours().toString().padStart(2, "0"),
    minutes: ist.getMinutes().toString().padStart(2, "0"),
    seconds: ist.getSeconds().toString().padStart(2, "0"),
  };
}

export const DigitalClock: React.FC<DigitalClockProps> = ({ className }) => {
  const [time, setTime] = useState<TimeState>(getISTTime);
  const timeoutRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const startTicker = () => {
      setTime(getISTTime());
      intervalRef.current = window.setInterval(() => {
        setTime(getISTTime());
      }, 1000);
    };

    const scheduleStart = () => {
      const now = new Date();
      const delay = 1000 - now.getMilliseconds();
      timeoutRef.current = window.setTimeout(startTicker, delay);
    };

    scheduleStart();

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "mt-6 flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-[linear-gradient(135deg,var(--border-light)_0%,transparent_100%)] px-2 py-[0.2rem] font-mono transition-[border-color,box-shadow] duration-300 ease-in-out hover:border-muted-foreground hover:shadow-[0_0_15px_rgba(56,189,248,0.1)] sm:mt-0 sm:w-fit sm:justify-start sm:bg-none sm:p-0",
        className,
      )}
    >
      <div className="flex items-baseline text-sm font-light tracking-[0.05em]">
        <span className="min-w-[1.5ch] text-center tabular-nums text-foreground">
          {time.hours}
        </span>
        <span className="animate-clock-blink mx-[0.1rem] text-muted-foreground">
          :
        </span>
        <span className="min-w-[1.5ch] text-center tabular-nums text-foreground">
          {time.minutes}
        </span>
        <span className="animate-clock-blink mx-[0.1rem] text-muted-foreground">
          :
        </span>
        <span className="min-w-[1.5ch] text-center tabular-nums text-secondary-foreground">
          {time.seconds}
        </span>
      </div>
      <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
        IST
      </span>
    </div>
  );
};
