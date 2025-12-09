import { BeamConfig, CalculationResult, LoadType, SupportType } from "../types";

export const calculateBeam = (config: BeamConfig): CalculationResult => {
  const steps = 400; // Increased precision
  const dx = config.length / steps;
  const points = [];

  let r1 = 0;
  let r2 = 0;
  let r1Pos = 0;
  let r2Pos = 0;
  let rMoment = 0;

  const sortedSupports = [...config.supports].sort(
    (a, b) => a.position - b.position,
  );

  // --- 1. Calculate Total Load Forces and Moments for Equilibrium ---
  let totalForceLoads = 0; // Downward positive for tracking total load magnitude

  // Helper to get force and center of gravity for a load
  const getLoadStats = (load: any) => {
    if (load.type === LoadType.POINT) {
      return { force: load.magnitude, center: load.position };
    } else if (load.type === LoadType.DISTRIBUTED && load.length) {
      return {
        force: load.magnitude * load.length,
        center: load.position + load.length / 2,
      };
    } else if (load.type === LoadType.TRIANGULAR && load.length) {
      // Area of triangle = 0.5 * base * height
      // Centroid is at 2/3 of base from the zero end (assuming 0 -> Max L-R)
      return {
        force: 0.5 * load.magnitude * load.length,
        center: load.position + load.length * (2 / 3),
      };
    }
    return { force: 0, center: 0 };
  };

  config.loads.forEach((load) => {
    const stats = getLoadStats(load);
    totalForceLoads += stats.force;
  });

  // --- 2. Solve Reactions ---
  if (
    sortedSupports.length === 1 &&
    sortedSupports[0].type === SupportType.FIXED
  ) {
    // Cantilever
    const support = sortedSupports[0];
    r1Pos = support.position;
    r1 = totalForceLoads; // Upward reaction balances downward loads

    // Calculate Moment Reaction
    let momentSum = 0;
    config.loads.forEach((load) => {
      const stats = getLoadStats(load);
      // Moment arm relative to support
      const arm = stats.center - support.position;
      momentSum += stats.force * arm;
    });

    // Reaction moment must oppose the load moment
    rMoment = -momentSum;
  } else if (sortedSupports.length >= 2) {
    // Simply Supported (Assume First and Last support take the load for determiniate approx)
    // If more than 2, this simple solver isn't strictly correct for indeterminate,
    // but we will use the outer two for simple beam logic or closest 2 logic.
    // For this app, we assume determinate 2-support beams.

    const s1 = sortedSupports[0];
    const s2 = sortedSupports[sortedSupports.length - 1]; // Use last one
    r1Pos = s1.position;
    r2Pos = s2.position;

    // Sum Moments about R1 = 0
    let momentSumAboutR1 = 0;
    config.loads.forEach((load) => {
      const stats = getLoadStats(load);
      momentSumAboutR1 += stats.force * (stats.center - r1Pos);
    });

    // R2 * (dist) = MomentSum
    r2 = momentSumAboutR1 / (r2Pos - r1Pos);
    r1 = totalForceLoads - r2;
  }

  // --- 3. Calculate Shear (V) and Moment (M) along beam ---
  let maxM = 0;
  let maxV = 0;

  for (let i = 0; i <= steps; i++) {
    const x = i * dx;
    let shear = 0;
    let moment = 0;

    // A. Reaction Contributions (Upward forces)
    // We treat Upward as Positive Shear contribution from Left
    if (sortedSupports.length === 1) {
      // Cantilever
      if (x >= r1Pos) {
        shear += r1;
        moment += r1 * (x - r1Pos);
        moment += rMoment; // Applied couple
      }
    } else {
      if (x >= r1Pos) {
        shear += r1;
        moment += r1 * (x - r1Pos);
      }
      if (x >= r2Pos) {
        shear += r2;
        moment += r2 * (x - r2Pos);
      }
    }

    // B. Load Contributions (Downward forces)
    config.loads.forEach((load) => {
      // 1. Point Load
      if (load.type === LoadType.POINT) {
        if (x >= load.position) {
          shear -= load.magnitude;
          moment -= load.magnitude * (x - load.position);
        }
      }
      // 2. Distributed Load (Uniform)
      else if (load.type === LoadType.DISTRIBUTED && load.length) {
        if (x > load.position) {
          const start = load.position;
          const end = load.position + load.length;

          // Determine the active portion of the load to the left of x
          const activeLen = Math.min(x, end) - start;
          if (activeLen > 0) {
            const activeForce = load.magnitude * activeLen;
            shear -= activeForce;
            // Moment arm is from the centroid of the active rectangular block to x
            // Centroid of active block is at (start + activeLen/2)
            const centroid = start + activeLen / 2;
            moment -= activeForce * (x - centroid);
          }
        }
      }
      // 3. Triangular Load (0 to q)
      else if (load.type === LoadType.TRIANGULAR && load.length) {
        if (x > load.position) {
          const start = load.position;
          const end = load.position + load.length;
          const L = load.length;
          const q = load.magnitude;

          // If we are inside the triangle
          if (x <= end) {
            const d = x - start; // distance into load
            // Load height at x: h = q * (d/L)
            // Force is area of small triangle: 0.5 * d * h = 0.5 * d * q * d/L = q*d^2 / (2L)
            const force = (q * d * d) / (2 * L);
            shear -= force;
            // Centroid of small triangle is at start + (2/3)d
            const centroid = start + (2 * d) / 3;
            moment -= force * (x - centroid);
          }
          // If we are past the triangle
          else {
            const totalForce = 0.5 * q * L;
            shear -= totalForce;
            const centroid = start + (2 * L) / 3;
            moment -= totalForce * (x - centroid);
          }
        }
      }
    });

    // Zero out small rounding errors
    if (Math.abs(shear) < 1e-4) shear = 0;
    if (Math.abs(moment) < 1e-4) moment = 0;

    if (Math.abs(shear) > Math.abs(maxV)) maxV = Math.abs(shear);
    if (Math.abs(moment) > Math.abs(maxM)) maxM = Math.abs(moment);

    points.push({ x, shear, moment });
  }

  return {
    points,
    maxShear: maxV,
    maxMoment: maxM,
    reactions: { R1: r1, R2: r2, M_R: rMoment },
  };
};
