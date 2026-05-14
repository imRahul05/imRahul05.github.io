import React, { useState, useEffect, useRef } from "react";

interface TimeState {
  hours: string;
  minutes: string;
  seconds: string;
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

export const DigitalClock: React.FC = () => {
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
    <div className="digital-clock">
      <div className="clock-display">
        <span className="clock-segment clock-hours">{time.hours}</span>
        <span className="clock-separator">:</span>
        <span className="clock-segment clock-minutes">{time.minutes}</span>
        <span className="clock-separator">:</span>
        <span className="clock-segment clock-seconds">{time.seconds}</span>
      </div>
      <span className="clock-label">IST</span>
    </div>
  );
};
