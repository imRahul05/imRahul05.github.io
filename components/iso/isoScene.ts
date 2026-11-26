/**
 * Scene description for the isometric "Claims Foundry" diorama.
 * Units are grid cells on the base plate; z is height.
 */

export type Vec2 = [number, number];

export interface BoxSpec {
  x: number;
  y: number;
  z?: number;
  w: number;
  d: number;
  h: number;
}

export type StationKind =
  "intake" | "parse" | "coder" | "rules" | "submit" | "payer";

export interface Station {
  id: StationKind;
  index: string;
  name: string;
  blurb: string;
  base: BoxSpec;
  /** Distance along the belt at which a packet is "processed" here */
  at: number;
}

export const PLATE: BoxSpec = {
  x: -0.4,
  y: -0.7,
  z: -0.35,
  w: 14.2,
  d: 9,
  h: 0.35,
};

export const CENTER: Vec2 = [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d / 2];

/** Conveyor polyline (z = 0) */
export const BELT: Vec2[] = [
  [0.8, 2.2],
  [12.6, 2.2],
  [12.6, 6.4],
  [2.6, 6.4],
];

export const BELT_WIDTH = 0.9;

export const STATIONS: Station[] = [
  {
    id: "intake",
    index: "01",
    name: "Intake",
    blurb:
      "Clinical notes and claim documents arrive — PDFs, scans, EHR exports.",
    base: { x: 0.5, y: 0.15, w: 2.3, d: 1.35, h: 0.7 },
    at: 0.4,
  },
  {
    id: "parse",
    index: "02",
    name: "Parse",
    blurb: "OCR + layout parsing turns every page into structured text.",
    base: { x: 4.6, y: 0.15, w: 2.2, d: 1.35, h: 1.1 },
    at: 4.9,
  },
  {
    id: "coder",
    index: "03",
    name: "AI Coder",
    blurb:
      "An LLM proposes ICD-10 / CPT codes, each one tied back to evidence in the note.",
    base: { x: 8.5, y: -0.05, w: 2.7, d: 1.55, h: 1.35 },
    at: 9.2,
  },
  {
    id: "rules",
    index: "04",
    name: "Rules",
    blurb:
      "Deterministic edits validate every code — the model suggests, tested code decides.",
    base: { x: 9.2, y: 7.0, w: 2.2, d: 1.2, h: 0.9 },
    at: 18.3,
  },
  {
    id: "submit",
    index: "05",
    name: "Submit",
    blurb: "A clean claim is assembled, signed off and queued for submission.",
    base: { x: 4.8, y: 7.0, w: 2.2, d: 1.2, h: 0.7 },
    at: 22.7,
  },
  {
    id: "payer",
    index: "06",
    name: "Payer",
    blurb: "Submitted to the payer; status flows back into the dashboard.",
    base: { x: 0.5, y: 5.5, w: 1.8, d: 1.8, h: 2.6 },
    at: 26,
  },
];

/** Example public code-set values shown on coded packets (no patient data). */
export const SAMPLE_CODES = [
  "E11.9",
  "I10",
  "99214",
  "J45.909",
  "M54.5",
  "Z00.00",
];

/* ------------------------------ Belt path -------------------------------- */

const segLengths = BELT.slice(1).map((p, i) =>
  Math.hypot(p[0] - BELT[i][0], p[1] - BELT[i][1]),
);
export const BELT_LENGTH = segLengths.reduce((a, b) => a + b, 0);

/** Point on the belt at distance `s` from its start. */
export const beltPoint = (s: number): Vec2 => {
  let d = Math.max(0, Math.min(BELT_LENGTH, s));
  for (let i = 0; i < segLengths.length; i++) {
    if (d <= segLengths[i] || i === segLengths.length - 1) {
      const t = segLengths[i] === 0 ? 0 : d / segLengths[i];
      const a = BELT[i];
      const b = BELT[i + 1];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    d -= segLengths[i];
  }
  return BELT[BELT.length - 1];
};
