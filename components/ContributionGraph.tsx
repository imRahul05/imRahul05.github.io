import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";

import "./styles/contribution.scss";

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

// Geometry is fixed, so it lives at module scope and is computed once.
const CELL_SIZE = 10;
const CELL_GAP = 3;
const CELL_STRIDE = CELL_SIZE + CELL_GAP;
const PADDING_LEFT = 35;
const PADDING_TOP = 20;
const PADDING_RIGHT = 10;
const PADDING_BOTTOM = 10;
const GRID_HEIGHT =
  PADDING_TOP + DAYS_IN_WEEK * CELL_STRIDE - CELL_GAP + PADDING_BOTTOM;

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

const CONTRIBUTION_LEVELS = [0, 1, 2, 3, 4] as const;
const CONTRIBUTION_COUNTS = [0, 1, 2, 4, 8];
const DEFAULT_GITHUB_USERNAME = "imRahul05";
const CONTRIBUTIONS_API_URL = "https://github-contributions-api.jogruber.de/v4";

// Day labels never change, so precompute their geometry once.
const DAY_LABELS = DAYS.map((day, index) => ({
  day,
  index,
  y: PADDING_TOP + index * CELL_STRIDE + CELL_SIZE / 2,
})).filter((entry) => entry.index % 2 === 0);

interface CellData {
  key: string;
  x: number;
  y: number;
  level: number;
  date: string;
  count: number;
  label: string;
}

interface MonthHeader {
  month: string;
  startWeek: number;
  x: number;
}

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
  if (currentDate < startDate) return startDate;
  if (currentDate > endDate) return endDate;
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
}): MonthHeader[] => {
  const headers: MonthHeader[] = [];
  let currentMonth = -1;
  let currentYear = -1;
  let monthStartWeek = 0;

  const pushHeader = (monthIndex: number, startWeek: number) => {
    headers.push({
      month: MONTHS[monthIndex],
      startWeek,
      x: PADDING_LEFT + startWeek * CELL_STRIDE,
    });
  };

  const anchor = new Date(firstSunday);
  for (let weekNumber = 0; weekNumber < totalWeeks; weekNumber += 1) {
    anchor.setTime(firstSunday.getTime());
    anchor.setDate(firstSunday.getDate() + weekNumber * DAYS_IN_WEEK);
    const clamped = clampDateToWindow(anchor, startDate, endDate);
    const monthKey = clamped.getMonth();
    const yearKey = clamped.getFullYear();

    if (monthKey !== currentMonth || yearKey !== currentYear) {
      if (currentMonth !== -1) {
        pushHeader(currentMonth, monthStartWeek);
      }
      currentMonth = monthKey;
      currentYear = yearKey;
      monthStartWeek = weekNumber;
    }
  }

  if (currentMonth !== -1) {
    pushHeader(currentMonth, monthStartWeek);
  }

  return headers;
};

export const generateContributionData = (
  referenceDate: Date = new Date(),
): ContributionData[] => {
  const { endDate, startDate } = getWindowBounds(referenceDate);
  const data: ContributionData[] = [];
  const startTime = startDate.getTime();

  for (
    const currentDate = new Date(startDate);
    currentDate <= endDate;
    currentDate.setDate(currentDate.getDate() + 1)
  ) {
    const dateKey = toDateKey(currentDate);
    const dayOfYear = Math.floor(
      (currentDate.getTime() - startTime) / MS_PER_DAY,
    );
    const dayOfWeek = currentDate.getDay();
    const weekdayPenalty = dayOfWeek === 0 || dayOfWeek === 6 ? 0.4 : 1;
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

const EMPTY_ARRAY: ContributionData[] = [];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const [dateYear, dateMonth, dateDay] = dateString.split("-").map(Number);
  const date = new Date(dateYear, dateMonth - 1, dateDay, 12);
  return DATE_FORMATTER.format(date);
};

const getContributionText = (count: number) => {
  if (count === 0) return "No contributions";
  if (count === 1) return "1 contribution";
  return `${count} contributions`;
};

// Cells are the expensive part of the tree (~370 nodes) and only change when
// the source data or the date window change. Isolating them behind memo means
// loading / reduced-motion state changes never re-render the grid.
const GraphCells = memo(function GraphCells({ cells }: { cells: CellData[] }) {
  return (
    <>
      {cells.map((cell) =>
        cell.date ? (
          <rect
            key={cell.key}
            x={cell.x}
            y={cell.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            className={`contribution-graph-cell contribution-level-${cell.level}`}
            data-date={cell.date}
            data-count={cell.count}
            data-level={cell.level}
            role="gridcell"
            aria-label={cell.label}
          />
        ) : (
          <rect
            key={cell.key}
            x={cell.x}
            y={cell.y}
            width={CELL_SIZE}
            height={CELL_SIZE}
            className="contribution-graph-cell contribution-level-0"
            aria-hidden="true"
          />
        ),
      )}
    </>
  );
});

export function ContributionGraph({
  data = EMPTY_ARRAY,
  className = "",
  showLegend = true,
  showTooltips = true,
  githubUsername = DEFAULT_GITHUB_USERNAME,
}: ContributionGraphProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipCountRef = useRef<HTMLDivElement>(null);
  const tooltipDateRef = useRef<HTMLDivElement>(null);
  const lastHoverDateRef = useRef<string | null>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [remoteData, setRemoteData] = useState<ContributionData[] | null>(null);
  const [isRemoteLoading, setIsRemoteLoading] = useState(false);

  const { endDate, firstSunday, startDate, totalWeeks } = useMemo(
    () => getWindowBounds(),
    [],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setPrefersReducedMotion(media.matches);
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
        // AbortError and network failures both fall back to the prop data.
        setRemoteData(null);
      } finally {
        setIsRemoteLoading(false);
      }
    };

    loadRemoteData();
    return () => controller.abort();
  }, [githubUsername]);

  // Single pass that walks the date window once. The Date cursor is mutated in
  // place (one allocation instead of ~370), and the aria-label / formatted date
  // are baked in here so render and hover never touch Intl.DateTimeFormat.
  const cells = useMemo<CellData[]>(() => {
    const sourceData = remoteData ?? data;
    const contributionMap = new Map<string, ContributionData>();
    for (const item of sourceData) contributionMap.set(item.date, item);

    const total = totalWeeks * DAYS_IN_WEEK;
    const result: CellData[] = new Array(total);
    const cursor = new Date(firstSunday);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    let index = 0;
    for (let week = 0; week < totalWeeks; week += 1) {
      const x = PADDING_LEFT + week * CELL_STRIDE;
      for (let day = 0; day < DAYS_IN_WEEK; day += 1) {
        const y = PADDING_TOP + day * CELL_STRIDE;
        const time = cursor.getTime();

        if (time >= startTime && time <= endTime) {
          const dateKey = toDateKey(cursor);
          const entry = contributionMap.get(dateKey);
          const count = entry?.count ?? 0;
          const level = entry?.level ?? 0;
          result[index] = {
            key: dateKey,
            x,
            y,
            level,
            date: dateKey,
            count,
            label: `${formatDate(dateKey)}: ${getContributionText(count)}`,
          };
        } else {
          result[index] = {
            key: `empty-${index}`,
            x,
            y,
            level: 0,
            date: EMPTY_DATE,
            count: 0,
            label: "",
          };
        }

        cursor.setDate(cursor.getDate() + 1);
        index += 1;
      }
    }

    return result;
  }, [data, remoteData, firstSunday, startDate, endDate, totalWeeks]);

  const monthHeaders = useMemo(
    () =>
      calculateMonthHeaders({ endDate, firstSunday, startDate, totalWeeks }),
    [endDate, firstSunday, startDate, totalWeeks],
  );

  const svgWidth =
    PADDING_LEFT + totalWeeks * CELL_STRIDE - CELL_GAP + PADDING_RIGHT;

  const handleMouseLeave = useCallback(() => {
    lastHoverDateRef.current = null;
    const tooltip = tooltipRef.current;
    if (tooltip) {
      tooltip.style.opacity = "0";
      tooltip.style.visibility = "hidden";
    }
  }, []);

  // Hot path: fires on every pointer move. We resolve the target via event
  // delegation, follow the cursor on every move, but only rewrite the tooltip
  // text (and run formatDate) when the hovered cell actually changes.
  const handleMouseMove = useCallback(
    (event: MouseEvent<SVGSVGElement>) => {
      if (!showTooltips) return;
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const target = event.target as SVGElement;
      const isCell =
        target?.tagName === "rect" &&
        target.classList.contains("contribution-graph-cell");
      const date = isCell ? target.getAttribute("data-date") : null;

      if (!date) {
        if (lastHoverDateRef.current !== null) handleMouseLeave();
        return;
      }

      tooltip.style.transform = `translate3d(${event.clientX + TOOLTIP_OFFSET_X}px, ${
        event.clientY - TOOLTIP_OFFSET_Y
      }px, 0)`;

      if (date !== lastHoverDateRef.current) {
        lastHoverDateRef.current = date;
        const count = Number(target.getAttribute("data-count"));
        if (tooltipCountRef.current) {
          tooltipCountRef.current.textContent = getContributionText(count);
        }
        if (tooltipDateRef.current) {
          tooltipDateRef.current.textContent = formatDate(date);
        }
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
      }
    },
    [showTooltips, handleMouseLeave],
  );

  return (
    <div className={`contribution-graph ${className}`.trim()}>
      <div className="contribution-graph-scroll">
        {isRemoteLoading && (
          <div className="contribution-graph-loading">Syncing with GitHub…</div>
        )}

        <svg
          width={svgWidth}
          height={GRID_HEIGHT}
          viewBox={`0 0 ${svgWidth} ${GRID_HEIGHT}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ display: "block", overflow: "visible" }}
          role="grid"
          aria-readonly="true"
          aria-label={`Contribution activity for ${githubUsername}`}
        >
          {monthHeaders.map((header) => (
            <text
              key={`${header.month}-${header.startWeek}`}
              x={header.x}
              y="12"
              className="contribution-graph-month-label"
            >
              {header.month}
            </text>
          ))}

          {DAY_LABELS.map((entry) => (
            <text
              key={entry.day}
              x="0"
              y={entry.y}
              className="contribution-graph-day-label-svg"
            >
              {entry.day}
            </text>
          ))}

          <GraphCells cells={cells} />
        </svg>
      </div>

      {showTooltips && (
        <div
          ref={tooltipRef}
          className="contribution-graph-tooltip-wrapper"
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            zIndex: 50,
            pointerEvents: "none",
            opacity: 0,
            visibility: "hidden",
            transition: prefersReducedMotion ? "none" : "opacity 0.12s ease",
          }}
        >
          <div
            className={`contribution-graph-tooltip ${
              prefersReducedMotion ? "is-static" : "is-animated"
            }`}
          >
            <div
              ref={tooltipCountRef}
              className="contribution-graph-tooltip-count"
            />
            <div
              ref={tooltipDateRef}
              className="contribution-graph-tooltip-date"
            />
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
