import { useEffect, useMemo, useState } from "react";

export interface ContributionData {
  count: number;
  date: string;
  level: number;
}

export interface ContributionGraphProps {
  className?: string;
  data?: ContributionData[];
  showLegend?: boolean;
  showTooltips?: boolean;
  githubUsername?: string;
}

const MONTHS_IN_WINDOW = 12;
const DAYS_IN_WEEK = 7;
const TOOLTIP_OFFSET_X = 10;
const TOOLTIP_OFFSET_Y = 40;
const EMPTY_DATE = "";
const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DAY_1 = 1;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CONTRIBUTION_COLORS = [
  "contribution-level-0",
  "contribution-level-1",
  "contribution-level-2",
  "contribution-level-3",
  "contribution-level-4",
];

const CONTRIBUTION_LEVELS = [0, 1, 2, 3, 4] as const;
const CONTRIBUTION_COUNTS = [0, 1, 2, 4, 8];
const DEFAULT_GITHUB_USERNAME = "imRahul05";
const CONTRIBUTIONS_API_URL = "https://github-contributions-api.jogruber.de/v4";

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const hashString = (input: string) => {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }

  return hash;
};

const seededValue = (input: string) => {
  const hash = hashString(input);
  return (Math.sin(hash) + 1) / 2;
};

const createDayData = (
  currentDate: Date,
  contributionData: ContributionData[],
): ContributionData => {
  const dateKey = toDateKey(currentDate);
  const existingData = contributionData.find((entry) => entry.date === dateKey);

  return {
    date: dateKey,
    count: existingData?.count ?? 0,
    level: existingData?.level ?? 0,
  };
};

interface MonthHeaderCheck {
  currentMonth: number;
  currentYear: number;
  weekCount: number;
}

const shouldShowMonthHeader = ({
  currentYear,
  currentMonth,
  weekCount,
}: MonthHeaderCheck) => {
  return currentYear >= 0 && currentMonth >= 0 && weekCount > 0;
};

const getWindowBounds = (referenceDate: Date = new Date()) => {
  const startDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() - (MONTHS_IN_WINDOW - 1),
    DAY_1,
  );
  const endDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );
  const firstSunday = new Date(startDate);
  firstSunday.setDate(startDate.getDate() - startDate.getDay());

  const lastSaturday = new Date(endDate);
  lastSaturday.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const totalWeeks = Math.ceil(
    (lastSaturday.getTime() - firstSunday.getTime() + MS_PER_DAY) /
      (DAYS_IN_WEEK * MS_PER_DAY),
  );

  return { endDate, firstSunday, startDate, totalWeeks };
};

const clampDateToWindow = (
  currentDate: Date,
  startDate: Date,
  endDate: Date,
) => {
  if (currentDate < startDate) {
    return startDate;
  }

  if (currentDate > endDate) {
    return endDate;
  }

  return currentDate;
};

const calculateMonthHeaders = ({
  endDate,
  firstSunday,
  startDate,
  totalWeeks,
}: {
  endDate: Date;
  firstSunday: Date;
  startDate: Date;
  totalWeeks: number;
}) => {
  const headers: { month: string; colspan: number; startWeek: number }[] = [];

  let currentMonth = -1;
  let currentYear = -1;
  let monthStartWeek = 0;
  let weekCount = 0;

  for (let weekNumber = 0; weekNumber < totalWeeks; weekNumber += 1) {
    const weekDate = new Date(firstSunday);
    weekDate.setDate(firstSunday.getDate() + weekNumber * DAYS_IN_WEEK);
    const anchorDate = clampDateToWindow(weekDate, startDate, endDate);

    const monthKey = anchorDate.getMonth();
    const yearKey = anchorDate.getFullYear();

    if (monthKey !== currentMonth || yearKey !== currentYear) {
      if (
        currentMonth !== -1 &&
        shouldShowMonthHeader({
          currentYear,
          currentMonth,
          weekCount,
        })
      ) {
        headers.push({
          month: MONTHS[currentMonth],
          colspan: weekCount,
          startWeek: monthStartWeek,
        });
      }

      currentMonth = monthKey;
      currentYear = yearKey;
      monthStartWeek = weekNumber;
      weekCount = 1;
    } else {
      weekCount += 1;
    }
  }

  if (
    currentMonth !== -1 &&
    shouldShowMonthHeader({
      currentYear,
      currentMonth,
      weekCount,
    })
  ) {
    headers.push({
      month: MONTHS[currentMonth],
      colspan: weekCount,
      startWeek: monthStartWeek,
    });
  }

  return headers;
};

export const generateContributionData = (
  referenceDate: Date = new Date(),
): ContributionData[] => {
  const { endDate, startDate } = getWindowBounds(referenceDate);
  const data: ContributionData[] = [];

  for (
    const currentDate = new Date(startDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const dateKey = toDateKey(currentDate);
    const dayOfYear = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / MS_PER_DAY,
    );
    const weekdayPenalty =
      currentDate.getDay() === 0 || currentDate.getDay() === 6 ? 0.4 : 1;
    const seasonalWave =
      Math.sin(((dayOfYear - 40) / 365) * Math.PI * 2) * 0.35 + 0.65;
    const recencyWave =
      Math.sin(((dayOfYear - 160) / 365) * Math.PI * 4) * 0.12 + 0.88;
    const noise = seededValue(dateKey);
    const intensity = noise * 0.42 + seasonalWave * 0.34 + recencyWave * 0.24;
    const levelIndex = Math.min(
      4,
      Math.max(0, Math.floor(intensity * weekdayPenalty * 5)),
    );

    data.push({
      date: dateKey,
      count: CONTRIBUTION_COUNTS[levelIndex],
      level: levelIndex,
    });
  }

  return data;
};

export function ContributionGraph({
  data = [],
  className = "",
  showLegend = true,
  showTooltips = true,
  githubUsername = DEFAULT_GITHUB_USERNAME,
}: ContributionGraphProps) {
  const [hoveredDay, setHoveredDay] = useState<ContributionData | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [remoteData, setRemoteData] = useState<ContributionData[] | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);
  const { endDate, firstSunday, startDate, totalWeeks } = useMemo(
    () => getWindowBounds(),
    [],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = () => {
      setPrefersReducedMotion(media.matches);
    };

    handleChange();
    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadRemoteData = async () => {
      setIsRemoteLoading(true);

      try {
        const response = await fetch(
          `${CONTRIBUTIONS_API_URL}/${githubUsername}?y=last`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load contribution data: ${response.status}`,
          );
        }

        const payload: {
          contributions?: Array<{
            date: string;
            count: number;
            level?: number;
          }>;
        } = await response.json();

        const mappedData =
          payload.contributions?.map((entry) => ({
            date: entry.date,
            count: entry.count,
            level:
              entry.level ??
              Math.min(4, Math.max(0, Math.floor(entry.count / 2))),
          })) ?? null;

        setRemoteData(mappedData);
      } catch {
        setRemoteData(null);
      } finally {
        setIsRemoteLoading(false);
      }
    };

    loadRemoteData();

    return () => controller.abort();
  }, [githubUsername]);

  const windowData = useMemo(() => {
    const days: ContributionData[] = [];
    const sourceData = remoteData ?? data;

    for (let weekNum = 0; weekNum < totalWeeks; weekNum += 1) {
      for (let day = 0; day < DAYS_IN_WEEK; day += 1) {
        const currentDate = new Date(firstSunday);
        currentDate.setDate(
          firstSunday.getDate() + weekNum * DAYS_IN_WEEK + day,
        );

        if (currentDate >= startDate && currentDate <= endDate) {
          days.push(createDayData(currentDate, sourceData));
        } else {
          days.push({
            date: EMPTY_DATE,
            count: 0,
            level: 0,
          });
        }
      }
    }

    return days;
  }, [data, endDate, firstSunday, remoteData, startDate, totalWeeks]);

  const monthHeaders = useMemo(
    () =>
      calculateMonthHeaders({
        endDate,
        firstSunday,
        startDate,
        totalWeeks,
      }),
    [endDate, firstSunday, startDate, totalWeeks],
  );

  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "";
    }

    const [dateYear, dateMonth, dateDay] = dateString.split("-").map(Number);
    const date = new Date(dateYear, dateMonth - 1, dateDay, 12);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getContributionText = (count: number) => {
    if (count === 0) {
      return "No contributions";
    }

    if (count === 1) {
      return "1 contribution";
    }

    return `${count} contributions`;
  };

  return (
    <div className={`contribution-graph ${className}`.trim()}>
      <div className="contribution-graph-scroll">
        {isRemoteLoading && (
          <div className="contribution-graph-loading">Syncing with GitHub…</div>
        )}
        <table className="contribution-graph-table">
          <caption className="sr-only">
            Contribution Graph for the last 12 months
          </caption>

          <thead>
            <tr className="contribution-graph-month-row">
              <td className="contribution-graph-axis-spacer" />
              {monthHeaders.map((header) => (
                <td
                  className="contribution-graph-month-header"
                  colSpan={header.colspan}
                  key={`${header.month}-${header.startWeek}`}
                >
                  <span>{header.month}</span>
                </td>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: DAYS_IN_WEEK }, (_, dayIndex) => (
              <tr className="contribution-graph-row" key={DAYS[dayIndex]}>
                <td className="contribution-graph-axis-cell">
                  {dayIndex % 2 === 0 && (
                    <span className="contribution-graph-day-label">
                      {DAYS[dayIndex]}
                    </span>
                  )}
                </td>

                {Array.from({ length: totalWeeks }, (_, weekIndex) => {
                  const dayData =
                    windowData[weekIndex * DAYS_IN_WEEK + dayIndex];
                  const cellKey = `${dayData?.date ?? "empty"}-${weekIndex}-${dayIndex}`;

                  if (!dayData?.date) {
                    return (
                      <td
                        className="contribution-graph-cell-wrapper"
                        key={cellKey}
                      >
                        <div className="contribution-graph-cell contribution-level-0" />
                      </td>
                    );
                  }

                  return (
                    <td
                      className="contribution-graph-cell-wrapper"
                      key={cellKey}
                      onMouseEnter={(event) => {
                        if (!showTooltips) return;
                        setHoveredDay(dayData);
                        setTooltipPosition({
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                      title={
                        showTooltips
                          ? `${formatDate(dayData.date)}: ${getContributionText(dayData.count)}`
                          : undefined
                      }
                    >
                      <div
                        className={`contribution-graph-cell ${CONTRIBUTION_COLORS[dayData.level]}`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTooltips && hoveredDay && (
        <div
          className={`contribution-graph-tooltip ${
            prefersReducedMotion ? "is-static" : "is-animated"
          }`}
          style={{
            left: tooltipPosition.x + TOOLTIP_OFFSET_X,
            top: tooltipPosition.y - TOOLTIP_OFFSET_Y,
          }}
        >
          <div className="contribution-graph-tooltip-count">
            {getContributionText(hoveredDay.count)}
          </div>
          <div className="contribution-graph-tooltip-date">
            {formatDate(hoveredDay.date)}
          </div>
        </div>
      )}

      {showLegend && (
        <div className="contribution-graph-legend">
          <span>Less</span>
          <div className="contribution-graph-legend-swatch-row">
            {CONTRIBUTION_LEVELS.map((level) => (
              <div
                className={`contribution-graph-cell contribution-level-${level}`}
                key={level}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      )}
    </div>
  );
}

export default ContributionGraph;
