import { BeamConfig, LoadType, SupportType } from "../types";

const fmt = (n: number) => Number(n.toFixed(2)).toString();

export const generateStepByStepSolution = (config: BeamConfig): string => {
  let lines: string[] = [];

  // --- PRE-PROCESSING ---
  const supports = [...config.supports].sort((a, b) => a.position - b.position);
  const loads = [...config.loads].sort((a, b) => a.position - b.position);
  const L = config.length;

  // 1. HEADER
  lines.push("## Perhitungan Detail (Metode Irisan)");
  lines.push(
    `$$ \\text{Diketahui: Panjang Balok } L = ${L} \\text{ ${config.unitLength}} $$`,
  );

  lines.push(`**Tumpuan:**`);
  supports.forEach((s) => lines.push(`- ${s.type} di $x = ${s.position}$`));

  lines.push(`**Beban:**`);
  loads.forEach((l, i) => {
    if (l.type === LoadType.POINT)
      lines.push(`- $P_{${i + 1}} = ${l.magnitude}$ di $x=${l.position}$`);
    if (l.type === LoadType.DISTRIBUTED)
      lines.push(
        `- $q_{${i + 1}} = ${l.magnitude}$ dari $x=${l.position}$ s.d. $${l.position + (l.length || 0)}$`,
      );
    if (l.type === LoadType.TRIANGULAR)
      lines.push(
        `- $q_{\\text{max},${i + 1}} = ${l.magnitude}$ dari $x=${l.position}$ s.d. $${l.position + (l.length || 0)}$`,
      );
  });
  lines.push("---");

  // 2. REAKSI TUMPUAN
  lines.push("### 1. Menghitung Reaksi Tumpuan");

  let R1_val = 0,
    R2_val = 0;
  let Ma_val = 0; // Moment at A for cantilever

  // Calculate Equivalent Loads for Reaction Step
  const eqLoads = loads.map((l) => {
    if (l.type === LoadType.POINT)
      return { force: l.magnitude, pos: l.position };
    if (l.type === LoadType.DISTRIBUTED && l.length)
      return { force: l.magnitude * l.length, pos: l.position + l.length / 2 };
    if (l.type === LoadType.TRIANGULAR && l.length)
      return {
        force: 0.5 * l.magnitude * l.length,
        pos: l.position + (2 / 3) * l.length,
      };
    return { force: 0, pos: 0 };
  });

  if (supports.length === 2) {
    const A = supports[0];
    const B = supports[1];
    lines.push(
      `Tumpuan A (${A.type}) di $x=${A.position}$, Tumpuan B (${B.type}) di $x=${B.position}$.`,
    );

    // Sigma M_A = 0
    lines.push(`**a. Mencari Reaksi di B ($\\sum M_A = 0$)**`);
    lines.push(`Asumsi arah jarum jam positif (+).`);

    let sigmaM_eq: string[] = [];
    let sigmaM_val = 0;

    eqLoads.forEach((l) => {
      const arm = l.pos - A.position;
      const m = l.force * arm;
      // Using \cdot for multiplication
      sigmaM_eq.push(`(${fmt(l.force)} \\cdot ${fmt(arm)})`);
      sigmaM_val += m;
    });

    const distAB = B.position - A.position;
    lines.push(`$$ \\sum M_A = 0 $$`);
    lines.push(`$$ \\sum (P \\cdot d) - R_B \\cdot ${distAB} = 0 $$`);

    if (sigmaM_eq.length > 0) {
      lines.push(`$$ [ ${sigmaM_eq.join(" + ")} ] - R_B(${distAB}) = 0 $$`);
    }

    lines.push(`$$ ${fmt(sigmaM_val)} - R_B(${distAB}) = 0 $$`);

    R2_val = sigmaM_val / distAB;
    lines.push(
      `$$ R_B = \\frac{${fmt(sigmaM_val)}}{${distAB}} = \\mathbf{${fmt(R2_val)} \\text{ ${config.unitForce}}} $$`,
    );

    // Sigma F_y = 0
    lines.push(`\n**b. Mencari Reaksi di A ($\\sum F_v = 0$)**`);
    const totalLoad = eqLoads.reduce((s, l) => s + l.force, 0);
    lines.push(`$$ R_A + R_B - \\sum P = 0 $$`);
    lines.push(`$$ R_A + ${fmt(R2_val)} - ${fmt(totalLoad)} = 0 $$`);
    R1_val = totalLoad - R2_val;
    lines.push(
      `$$ R_A = ${fmt(totalLoad)} - ${fmt(R2_val)} = \\mathbf{${fmt(R1_val)} \\text{ ${config.unitForce}}} $$`,
    );
  } else if (supports.length === 1 && supports[0].type === SupportType.FIXED) {
    // Cantilever
    const A = supports[0];
    lines.push(`Tumpuan Jepit di A ($x=${A.position}$).`);

    // Force
    const totalLoad = eqLoads.reduce((s, l) => s + l.force, 0);
    lines.push(`**a. Mencari Reaksi Vertikal ($\\sum F_v = 0$)**`);
    lines.push(
      `$$ R_A = \\sum P = \\mathbf{${fmt(totalLoad)} \\text{ ${config.unitForce}}} $$`,
    );
    R1_val = totalLoad;

    // Moment
    lines.push(`\n**b. Mencari Momen Jepit ($\\sum M_A = 0$)**`);
    let m_sum = 0;
    let m_parts: string[] = [];
    eqLoads.forEach((l) => {
      const arm = l.pos - A.position;
      const m = l.force * Math.abs(arm);
      m_sum += m;
      m_parts.push(`(${fmt(l.force)} \\cdot ${fmt(Math.abs(arm))})`);
    });

    lines.push(`$$ M_A = \\sum (P \\cdot d) $$`);
    if (m_parts.length > 0) {
      lines.push(`$$ M_A = ${m_parts.join(" + ")} $$`);
    }
    Ma_val = -m_sum; // Usually reaction moment opposes loads
    lines.push(
      `$$ M_A = \\mathbf{${fmt(m_sum)} \\text{ ${config.unitForce}\\cdot ${config.unitLength}}} $$`,
    );
  }

  lines.push("---");
  lines.push("### 2. Analisis Gaya Dalam per Segmen (Metode Potongan)");

  // 3. SEGMENT ANALYSIS
  // Identify key x points
  let points = new Set<number>();
  points.add(0);
  points.add(L);
  supports.forEach((s) => points.add(s.position));
  loads.forEach((l) => {
    points.add(l.position);
    if (l.length) points.add(l.position + l.length);
  });
  const X = Array.from(points).sort((a, b) => a - b);

  // Iterate Intervals
  for (let i = 0; i < X.length - 1; i++) {
    const x_start = X[i];
    const x_end = X[i + 1];

    if (Math.abs(x_end - x_start) < 0.001) continue; // Skip tiny intervals

    lines.push(
      `\n#### **Segmen ${i + 1}: $${fmt(x_start)} \\le x \\le ${fmt(x_end)}$**`,
    );

    // Evaluate at boundaries
    const evalAt = (x: number) => {
      let v = 0;
      let m = 0;

      // Reactions
      supports.forEach((s, idx) => {
        if (s.position <= x) {
          const r = supports.length > 1 && idx === 1 ? R2_val : R1_val;
          if (s.position <= x + 0.0001) {
            // Include
            v += r;
            m += r * (x - s.position);
          }
          if (s.type === SupportType.FIXED && s.position <= x + 0.0001) {
            m += Ma_val;
          }
        }
      });

      // Loads
      loads.forEach((l) => {
        if (l.type === LoadType.POINT) {
          if (l.position <= x + 0.0001) {
            v -= l.magnitude;
            m -= l.magnitude * (x - l.position);
          }
        } else if (l.type === LoadType.DISTRIBUTED && l.length) {
          if (x > l.position) {
            const activeEnd = Math.min(x, l.position + l.length);
            const len = activeEnd - l.position;
            const force = l.magnitude * len;
            const center = l.position + len / 2;
            v -= force;
            m -= force * (x - center);
          }
        } else if (l.type === LoadType.TRIANGULAR && l.length) {
          if (x > l.position) {
            const L_load = l.length;
            const q_max = l.magnitude;
            if (x <= l.position + L_load) {
              const d = x - l.position;
              const q_x = q_max * (d / L_load);
              const force = 0.5 * d * q_x;
              const centroid_dist = d / 3;
              v -= force;
              m -= force * centroid_dist;
            } else {
              const total = 0.5 * q_max * L_load;
              const centroid = l.position + (2 / 3) * L_load;
              v -= total;
              m -= total * (x - centroid);
            }
          }
        }
      });
      return { v, m };
    };

    // Evaluate
    const resStart = evalAt(x_start + 0.0001); // Just right of start
    const resEnd = evalAt(x_end - 0.0001); // Just left of end

    // Identify equation type
    let v_desc = "Konstan";
    let m_desc = "Linear";

    // Check if distributed load is active in this segment
    const hasDist = loads.some(
      (l) =>
        l.type === LoadType.DISTRIBUTED &&
        l.position < x_end &&
        l.position + (l.length || 0) > x_start,
    );
    const hasTri = loads.some(
      (l) =>
        l.type === LoadType.TRIANGULAR &&
        l.position < x_end &&
        l.position + (l.length || 0) > x_start,
    );

    if (hasDist) {
      v_desc = "Linear";
      m_desc = "Parabolik (Kuadrat)";
    }
    if (hasTri) {
      v_desc = "Parabolik";
      m_desc = "Kubik";
    }
    if (
      Math.abs(resStart.v) < 0.01 &&
      Math.abs(resEnd.v) < 0.01 &&
      !hasDist &&
      !hasTri
    ) {
      v_desc = "Nol";
      m_desc = "Konstan";
    }

    lines.push(`- **Gaya Geser $V(x)$**: ${v_desc}`);
    lines.push(
      `$$ x = ${fmt(x_start)} \\rightarrow V = \\mathbf{${fmt(resStart.v)}} $$`,
    );
    lines.push(
      `$$ x = ${fmt(x_end)} \\rightarrow V = \\mathbf{${fmt(resEnd.v)}} $$`,
    );

    lines.push(`- **Momen Lentur $M(x)$**: ${m_desc}`);
    lines.push(
      `$$ x = ${fmt(x_start)} \\rightarrow M = \\mathbf{${fmt(resStart.m)}} $$`,
    );
    lines.push(
      `$$ x = ${fmt(x_end)} \\rightarrow M = \\mathbf{${fmt(resEnd.m)}} $$`,
    );

    // Check for Max Moment inside interval
    if ((resStart.v > 0 && resEnd.v < 0) || (resStart.v < 0 && resEnd.v > 0)) {
      if (hasDist) {
        const activeLoad = loads.find(
          (l) => l.type === LoadType.DISTRIBUTED && l.position <= x_start,
        );
        if (activeLoad) {
          const q = activeLoad.magnitude;
          const distToZero = Math.abs(resStart.v) / q;
          const x_zero = x_start + distToZero;
          const resZero = evalAt(x_zero);
          lines.push(`> **Momen Maksimum Lokal** (Geser $V=0$):`);
          lines.push(
            `$$ x = ${fmt(x_zero)} \\rightarrow M_{\\text{max}} = \\mathbf{${fmt(resZero.m)}} $$`,
          );
        }
      }
    }
  }

  lines.push("\n---");
  lines.push("### Ringkasan Hasil");
  lines.push(
    `1. **Reaksi**: $R_A = \\mathbf{${fmt(R1_val)}}$, $R_B = \\mathbf{${fmt(R2_val)}}$`,
  );
  if (Ma_val !== 0)
    lines.push(
      `2. **Momen Reaksi**: $M_A = \\mathbf{${fmt(Math.abs(Ma_val))}}$`,
    );
  lines.push(
    "3. **Diagram**: Lihat visualisasi grafik di atas untuk bentuk lengkap diagram geser dan momen.",
  );

  return lines.join("\n");
};
