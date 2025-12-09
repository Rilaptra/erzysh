import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Box, LayoutTemplate, Scan, Info } from "lucide-react";

type ShapeType =
  | "rectangle"
  | "hollow-rect"
  | "circle"
  | "hollow-circle"
  | "i-beam"
  | "t-beam";

const InertiaCalculator: React.FC = () => {
  const [shape, setShape] = useState<ShapeType>("rectangle");
  const [unit, setUnit] = useState<string>("mm");

  // Unified params state with default reasonable values
  const [p, setP] = useState({
    b: 200, // Width
    h: 300, // Height
    b_in: 150, // Inner Width (Hollow)
    h_in: 250, // Inner Height (Hollow)
    d: 200, // Diameter
    d_in: 150, // Inner Diameter
    tf: 20, // Flange Thickness
    tw: 15, // Web Thickness
  });

  const handleChange = (key: string, val: number) => {
    setP((prev) => ({ ...prev, [key]: val }));
  };

  const results = useMemo(() => {
    let Area = 0,
      Ix = 0,
      Iy = 0,
      Sx = 0;

    switch (shape) {
      case "rectangle":
        Area = p.b * p.h;
        Ix = (p.b * Math.pow(p.h, 3)) / 12;
        Iy = (p.h * Math.pow(p.b, 3)) / 12;
        break;

      case "hollow-rect":
        Area = p.b * p.h - p.b_in * p.h_in;
        Ix = (p.b * Math.pow(p.h, 3) - p.b_in * Math.pow(p.h_in, 3)) / 12;
        Iy = (p.h * Math.pow(p.b, 3) - p.h_in * Math.pow(p.b_in, 3)) / 12;
        break;

      case "circle":
        Area = (Math.PI * Math.pow(p.d, 2)) / 4;
        Ix = (Math.PI * Math.pow(p.d, 4)) / 64;
        Iy = Ix;
        break;

      case "hollow-circle":
        Area = (Math.PI / 4) * (Math.pow(p.d, 2) - Math.pow(p.d_in, 2));
        Ix = (Math.PI / 64) * (Math.pow(p.d, 4) - Math.pow(p.d_in, 4));
        Iy = Ix;
        break;

      case "i-beam":
        // Symmetric I-Beam
        // Overall: b * h. Voids: (b - tw) * (h - 2*tf)
        const voidW = Math.max(0, p.b - p.tw);
        const voidH = Math.max(0, p.h - 2 * p.tf);
        Area = p.b * p.h - voidW * voidH;
        Ix = (p.b * Math.pow(p.h, 3) - voidW * Math.pow(voidH, 3)) / 12;
        Iy =
          2 * ((p.tf * Math.pow(p.b, 3)) / 12) +
          ((p.h - 2 * p.tf) * Math.pow(p.tw, 3)) / 12;
        break;

      case "t-beam":
        // Flange (Top): b * tf
        // Web (Bottom): tw * (h - tf)
        const A1 = p.b * p.tf;
        const y1 = p.h - p.tf / 2; // Centroid from bottom
        const A2 = p.tw * (p.h - p.tf);
        const y2 = (p.h - p.tf) / 2; // Centroid from bottom

        Area = A1 + A2;
        const y_bar = Area > 0 ? (A1 * y1 + A2 * y2) / Area : 0;

        // Ix using Parallel Axis Theorem: sum( I + Ad^2 )
        const I1 = (p.b * Math.pow(p.tf, 3)) / 12;
        const d1 = y1 - y_bar;
        const Ix1 = I1 + A1 * d1 * d1;

        const I2 = (p.tw * Math.pow(p.h - p.tf, 3)) / 12;
        const d2 = y2 - y_bar;
        const Ix2 = I2 + A2 * d2 * d2;

        Ix = Ix1 + Ix2;
        // Iy (Symmetric about y axis)
        Iy =
          (p.tf * Math.pow(p.b, 3)) / 12 +
          ((p.h - p.tf) * Math.pow(p.tw, 3)) / 12;
        break;
    }

    // Sx Calculation
    let y_max = p.h / 2;
    if (shape === "circle" || shape === "hollow-circle") y_max = p.d / 2;
    if (shape === "t-beam") {
      const A1 = p.b * p.tf;
      const y1 = p.h - p.tf / 2;
      const A2 = p.tw * (p.h - p.tf);
      const y2 = (p.h - p.tf) / 2;
      const totalArea = A1 + A2;
      const y_bar = totalArea > 0 ? (A1 * y1 + A2 * y2) / totalArea : 0;
      y_max = Math.max(y_bar, p.h - y_bar);
    }
    Sx = y_max > 0 ? Ix / y_max : 0;

    return { Area, Ix, Iy, Sx };
  }, [shape, p]);

  const renderInputs = () => {
    switch (shape) {
      case "rectangle":
        return (
          <>
            <InputRow
              label="Lebar (b)"
              val={p.b}
              onChange={(v) => handleChange("b", v)}
            />
            <InputRow
              label="Tinggi (h)"
              val={p.h}
              onChange={(v) => handleChange("h", v)}
            />
          </>
        );
      case "hollow-rect":
        return (
          <>
            <InputRow
              label="Lebar Luar (B)"
              val={p.b}
              onChange={(v) => handleChange("b", v)}
            />
            <InputRow
              label="Tinggi Luar (H)"
              val={p.h}
              onChange={(v) => handleChange("h", v)}
            />
            <InputRow
              label="Lebar Dalam (b_in)"
              val={p.b_in}
              onChange={(v) => handleChange("b_in", v)}
            />
            <InputRow
              label="Tinggi Dalam (h_in)"
              val={p.h_in}
              onChange={(v) => handleChange("h_in", v)}
            />
          </>
        );
      case "circle":
        return (
          <InputRow
            label="Diameter (D)"
            val={p.d}
            onChange={(v) => handleChange("d", v)}
          />
        );
      case "hollow-circle":
        return (
          <>
            <InputRow
              label="Diameter Luar (D)"
              val={p.d}
              onChange={(v) => handleChange("d", v)}
            />
            <InputRow
              label="Diameter Dalam (d_in)"
              val={p.d_in}
              onChange={(v) => handleChange("d_in", v)}
            />
          </>
        );
      case "i-beam":
        return (
          <>
            <InputRow
              label="Lebar Flens (b)"
              val={p.b}
              onChange={(v) => handleChange("b", v)}
            />
            <InputRow
              label="Tinggi Total (h)"
              val={p.h}
              onChange={(v) => handleChange("h", v)}
            />
            <InputRow
              label="Tebal Flens (tf)"
              val={p.tf}
              onChange={(v) => handleChange("tf", v)}
            />
            <InputRow
              label="Tebal Badan (tw)"
              val={p.tw}
              onChange={(v) => handleChange("tw", v)}
            />
          </>
        );
      case "t-beam":
        return (
          <>
            <InputRow
              label="Lebar Flens (b)"
              val={p.b}
              onChange={(v) => handleChange("b", v)}
            />
            <InputRow
              label="Tinggi Total (h)"
              val={p.h}
              onChange={(v) => handleChange("h", v)}
            />
            <InputRow
              label="Tebal Flens (tf)"
              val={p.tf}
              onChange={(v) => handleChange("tf", v)}
            />
            <InputRow
              label="Tebal Badan (tw)"
              val={p.tw}
              onChange={(v) => handleChange("tw", v)}
            />
          </>
        );
      default:
        return null;
    }
  };

  // SVG Visualization based on shape
  const renderVisual = () => {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;

    // Gradient & Stroke styles
    const fillClass = "fill-cyan-500/10 dark:fill-cyan-400/10";
    const strokeClass = "stroke-cyan-600 dark:stroke-cyan-400";

    let content = null;

    if (shape === "rectangle") {
      content = (
        <rect
          x={cx - 40}
          y={cy - 60}
          width="80"
          height="120"
          className={`${fillClass} ${strokeClass}`}
          strokeWidth="2"
        />
      );
    } else if (shape === "hollow-rect") {
      content = (
        <path
          className={`${fillClass} ${strokeClass}`}
          strokeWidth="2"
          fillRule="evenodd"
          d={`M${cx - 50},${cy - 70} h100 v140 h-100 z M${cx - 30},${cy - 50} h60 v100 h-60 z`}
        />
      );
    } else if (shape === "circle") {
      content = (
        <circle
          cx={cx}
          cy={cy}
          r="60"
          className={`${fillClass} ${strokeClass}`}
          strokeWidth="2"
        />
      );
    } else if (shape === "hollow-circle") {
      content = (
        <path
          className={`${fillClass} ${strokeClass}`}
          strokeWidth="2"
          fillRule="evenodd"
          d={`M${cx},${cy} m-60,0 a60,60 0 1,0 120,0 a60,60 0 1,0 -120,0 M${cx},${cy} m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0`}
        />
      );
    } else if (shape === "i-beam") {
      content = (
        <polygon
          points="40,20 120,20 120,40 90,40 90,120 120,120 120,140 40,140 40,120 70,120 70,40 40,40"
          className={`${fillClass} ${strokeClass}`}
          strokeWidth="2"
          transform="translate(20, 10)"
        />
      );
    } else if (shape === "t-beam") {
      content = (
        <polygon
          points="40,20 120,20 120,40 90,40 90,140 70,140 70,40 40,40"
          className={`${fillClass} ${strokeClass}`}
          strokeWidth="2"
          transform="translate(20, 10)"
        />
      );
    }

    return (
      <div className="group relative">
        {/* Graph Paper Background Effect */}
        <div className="absolute inset-0 rounded-xl bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>

        {/* Glow Effect behind SVG */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/5 opacity-50 blur-3xl transition-opacity duration-700 group-hover:opacity-100"></div>

        <svg
          width={size}
          height={size}
          className="relative z-10 mx-auto transition-transform duration-500 group-hover:scale-105"
        >
          {/* Definitions for gradients if needed */}
          <defs>
            <linearGradient
              id="shapeGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {content}
          {/* Center crosshair */}
          <line
            x1={cx - 5}
            y1={cy}
            x2={cx + 5}
            y2={cy}
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <line
            x1={cx}
            y1={cy - 5}
            x2={cx}
            y2={cy + 5}
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </svg>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-cyan-100/50 dark:border-cyan-900/30">
      <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <span className="animate-float rounded-lg bg-white/20 p-1.5 backdrop-blur-sm">
            <Calculator className="h-5 w-5 text-white" />
          </span>
          Kalkulator Properti Penampang
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Inputs */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-5 rounded-xl border border-cyan-100/50 bg-gradient-to-br from-cyan-50/50 via-white to-blue-50/30 p-5 shadow-sm dark:from-cyan-950/30 dark:via-slate-900/50 dark:to-slate-900">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold text-cyan-800 dark:text-cyan-200">
                    <Scan className="h-4 w-4" /> Bentuk Penampang
                  </Label>
                  <Select
                    value={shape}
                    onValueChange={(val) => setShape(val as ShapeType)}
                  >
                    <SelectTrigger className="border-cyan-200 bg-white focus:ring-cyan-500 dark:border-cyan-800 dark:bg-slate-950">
                      <SelectValue placeholder="Pilih Bentuk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rectangle">Persegi (Solid)</SelectItem>
                      <SelectItem value="hollow-rect">
                        Persegi Berongga (Tube)
                      </SelectItem>
                      <SelectItem value="circle">Lingkaran (Solid)</SelectItem>
                      <SelectItem value="hollow-circle">
                        Lingkaran Berongga (Pipe)
                      </SelectItem>
                      <SelectItem value="i-beam">Profil I (I-Beam)</SelectItem>
                      <SelectItem value="t-beam">Profil T (T-Beam)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 font-semibold text-cyan-800 dark:text-cyan-200">
                    <LayoutTemplate className="h-4 w-4" /> Satuan
                  </Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="border-cyan-200 bg-white focus:ring-cyan-500 dark:border-cyan-800 dark:bg-slate-950">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">Milimeter (mm)</SelectItem>
                      <SelectItem value="cm">Centimeter (cm)</SelectItem>
                      <SelectItem value="m">Meter (m)</SelectItem>
                      <SelectItem value="in">Inch (in)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-cyan-100 pt-4 dark:border-cyan-900/30">
                <Label className="text-muted-foreground mb-4 block text-xs font-bold uppercase">
                  Dimensi Input
                </Label>
                <div className="space-y-3">{renderInputs()}</div>
              </div>
            </div>
          </div>

          {/* Right Column: Visual & Results */}
          <div className="lg:col-span-7">
            <div className="flex h-full flex-col gap-6">
              <div className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
                {renderVisual()}
              </div>

              <Card className="flex-1 border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 shadow-md transition-shadow duration-500 hover:shadow-cyan-500/10 dark:border-cyan-900/50 dark:from-slate-900 dark:to-cyan-950/20">
                <CardContent className="p-6">
                  <h4 className="mb-6 flex items-center gap-2 text-lg font-bold text-cyan-900 dark:text-cyan-100">
                    <span className="rounded bg-cyan-100 p-1.5 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-400">
                      📊
                    </span>{" "}
                    Hasil Perhitungan
                  </h4>

                  <div className="space-y-4">
                    <ResultRow
                      label="Luas Area (A)"
                      value={results.Area}
                      unit={`${unit}²`}
                      icon={<Box className="h-4 w-4" />}
                    />
                    <div className="my-2 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent dark:via-cyan-800"></div>
                    <ResultRow
                      label="Momen Inersia X (Ix)"
                      value={results.Ix}
                      unit={`${unit}⁴`}
                      highlight
                      color="cyan"
                    />
                    <ResultRow
                      label="Momen Inersia Y (Iy)"
                      value={results.Iy}
                      unit={`${unit}⁴`}
                      highlight
                      color="blue"
                    />
                    <div className="my-2 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent dark:via-cyan-800"></div>
                    <ResultRow
                      label="Modulus Penampang (Sx)"
                      value={results.Sx}
                      unit={`${unit}³`}
                    />
                  </div>

                  <div className="mt-6 flex gap-3 rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-xs text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/20 dark:text-blue-300">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>
                      <strong>Catatan:</strong> Sumbu X adalah sumbu horizontal
                      yang melewati titik berat penampang (Centroid). Sumbu Y
                      adalah sumbu vertikal tegak lurus X.
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InputRow = ({
  label,
  val,
  onChange,
}: {
  label: string;
  val: number;
  onChange: (v: number) => void;
}) => (
  <div className="group flex items-center justify-between gap-4">
    <label className="text-sm font-medium whitespace-nowrap text-slate-600 transition-colors group-hover:text-cyan-600 dark:text-slate-400 dark:group-hover:text-cyan-400">
      {label}
    </label>
    <div className="relative">
      <Input
        type="number"
        min="0"
        step="any"
        value={val || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-9 w-28 border-slate-200 bg-white text-right font-mono text-sm transition-all hover:shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  </div>
);

const ResultRow = ({
  label,
  value,
  unit,
  highlight = false,
  color = "slate",
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
  color?: string;
  icon?: React.ReactNode;
}) => {
  const colorClasses = {
    cyan: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-800/50",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50",
    slate: "text-slate-700 dark:text-slate-300",
  };

  const containerClass = highlight
    ? `p-3 rounded-lg border flex items-center justify-between ${colorClasses[color as keyof typeof colorClasses]}`
    : "px-2 py-1 flex items-center justify-between";

  return (
    <div
      className={`${containerClass} group transition-all duration-300 hover:scale-[1.01]`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={`${highlight ? "font-bold" : "text-muted-foreground text-sm"}`}
        >
          {label}
        </span>
      </div>
      <span
        className={`font-mono ${highlight ? "text-lg font-bold" : "text-base font-medium"} flex items-baseline gap-1`}
      >
        {value < 10000 && value > 0.001
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : value.toExponential(3)}
        <span className="text-muted-foreground font-sans text-xs opacity-70">
          {unit}
        </span>
      </span>
    </div>
  );
};

export default InertiaCalculator;
