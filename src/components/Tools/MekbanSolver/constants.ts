import { BeamConfig, LoadType, SupportType } from "./types";

// Problems circled in the PDF
export const PRESETS: Record<string, BeamConfig> = {
  empty: {
    length: 10,
    supports: [],
    loads: [],
    unitLength: "m",
    unitForce: "kN",
  },
  "4.3-1": {
    length: 20, // ft
    unitLength: "ft",
    unitForce: "kips", // kips
    supports: [
      { id: "s1", position: 0, type: SupportType.PIN },
      { id: "s2", position: 20, type: SupportType.ROLLER },
    ],
    loads: [
      { id: "l1", type: LoadType.POINT, position: 5, magnitude: 4 },
      {
        id: "l2",
        type: LoadType.DISTRIBUTED,
        position: 10,
        length: 10,
        magnitude: 2,
      },
    ],
  },
  "4.3-2": {
    length: 4, // meters total (1+1+2)
    unitLength: "m",
    unitForce: "kN",
    supports: [{ id: "s1", position: 0, type: SupportType.FIXED }],
    loads: [
      { id: "l1", type: LoadType.POINT, position: 1, magnitude: 4 },
      {
        id: "l2",
        type: LoadType.DISTRIBUTED,
        position: 2,
        length: 2,
        magnitude: 1.5,
      },
    ],
  },
  "4.3-4": {
    length: 9, // m (1.5 + 6 + 1.5)
    unitLength: "m",
    unitForce: "kN",
    supports: [
      { id: "s1", position: 1.5, type: SupportType.PIN },
      { id: "s2", position: 7.5, type: SupportType.ROLLER }, // 1.5 + 6
    ],
    loads: [
      { id: "l1", type: LoadType.POINT, position: 1.5, magnitude: 4 }, // At support A? No, diagrams usually offset. Assuming it's ON the beam.
      // Looking at diagram 4.3-4: The beam is simple supported.
      // Wait, diagram shows supports AT A and B. A is at 0, B is at 9?
      // No, looking at 4.3-3 overhang. 4.3-4 looks like simple beam A to B.
      // 4kN is at 1.5m from A. 8kN is at 1.5m from B. Span is 6m + 1.5 + 1.5? Or total 6m?
      // "6m" is between loads. 1.5m is ends.
      // Let's assume Supports are at ends (0 and 9).
      // Load 1 at 1.5. Load 2 at 7.5.
      { id: "l2", type: LoadType.POINT, position: 7.5, magnitude: 8 },
    ],
  },
  "4.3-7": {
    length: 16, // ft
    unitLength: "ft",
    unitForce: "lbs",
    supports: [
      { id: "s1", position: 0, type: SupportType.PIN },
      { id: "s2", position: 16, type: SupportType.ROLLER },
    ],
    loads: [
      { id: "l1", type: LoadType.POINT, position: 8, magnitude: 225 }, // Middle of plank
    ],
  },
};
