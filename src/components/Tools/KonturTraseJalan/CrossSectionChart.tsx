// src/components/Tools/KonturTraseJalan/CrossSectionChart.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/ThemeProvider";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
);

interface ProfilePoint {
  distance: number;
  elevation: number;
}

interface CrossSectionChartProps {
  profileData: ProfilePoint[];
  title: string;
}

export function CrossSectionChart({
  profileData,
  title,
}: CrossSectionChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Hancurkan chart lama sebelum membuat yang baru
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const textColor =
      theme === "dark" ? "rgba(238, 238, 238, 0.8)" : "rgba(34, 40, 49, 0.8)";
    const gridColor =
      theme === "dark"
        ? "rgba(118, 171, 174, 0.1)"
        : "rgba(118, 171, 174, 0.2)";

    chartInstanceRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: profileData.map((p) => p.distance.toFixed(2)),
        datasets: [
          {
            label: "Elevasi",
            data: profileData.map((p) => p.elevation),
            borderColor: "#76abae", // teal-muted
            backgroundColor: "rgba(118, 171, 174, 0.2)",
            fill: true,
            tension: 0.1,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title,
            color: textColor,
            font: { size: 16 },
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Jarak: ${tooltipItems[0].label} cm`,
              label: (context) => `Elevasi: ${context.parsed.y?.toFixed(2)} m`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Jarak Sepanjang Garis Potongan (cm)",
              color: textColor,
            },
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            title: {
              display: true,
              text: "Elevasi (m)",
              color: textColor,
            },
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
        },
      },
    });
  }, [profileData, title, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Potongan Memanjang</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 md:h-80">
          <canvas ref={chartRef}></canvas>
        </div>
      </CardContent>
    </Card>
  );
}
