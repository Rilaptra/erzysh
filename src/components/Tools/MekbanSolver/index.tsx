"use client";

import { useState, useEffect, useRef } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { marked } from "marked";
import html2canvas from "html2canvas";
import katex from "katex";
import "katex/dist/katex.min.css";

import { PRESETS } from "./constants";
import {
  BeamConfig,
  CalculationResult,
  LoadType,
  SupportType,
  Load,
  Support,
  ReportItem,
} from "./types";
import { calculateBeam } from "./utils/beamCalculator";
import { generateStepByStepSolution } from "./utils/solutionGenerator";
import { exportToExcel, exportToWord } from "./utils/exporter";
import BeamVisualizer from "./components/BeamVisualizer";
import InertiaCalculator from "./components/InertiaCalculator";
import { explainBeamProblem } from "./services/geminiService";
import { useTheme } from "@/components/ThemeProvider";

// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash2, Plus, Save, Download } from "lucide-react";

// Custom Markdown Parser with Math Support
const parseMarkdownWithMath = (text: string): string => {
  const math: string[] = [];
  // Mask display math $$...$$
  let masked = text.replace(/\$\$([\s\S]+?)\$\$/g, (m) => {
    math.push(m);
    return `MATHDISPLAY${math.length - 1}ENDMATH`;
  });
  // Mask inline math $...$
  masked = masked.replace(/\$([^\$\n]+?)\$/g, (m) => {
    math.push(m);
    return `MATHINLINE${math.length - 1}ENDMATH`;
  });

  let html = marked.parse(masked) as string;

  // Restore
  math.forEach((m, i) => {
    html = html.replace(`MATHDISPLAY${i}ENDMATH`, m);
    html = html.replace(`MATHINLINE${i}ENDMATH`, m);
  });

  return html;
};

// Main Component
const MekbanSolver = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"beam" | "inertia">("beam");
  const [config, setConfig] = useState<BeamConfig>(PRESETS["4.3-1"]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const isDarkMode = theme === "dark";

  // Report Queue State
  const [reportQueue, setReportQueue] = useState<ReportItem[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [includeImages, setIncludeImages] = useState(true);

  // AI State
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Manual Solution Ref for Math Rendering
  const solutionRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  // Recalculate whenever config changes
  useEffect(() => {
    const res = calculateBeam(config);
    setResult(res);
    setAiExplanation("");
  }, [config]);

  // Render Math Safe (Adapted for NPM Katex)
  const renderMathSafe = (element: HTMLElement) => {
    if (!element) return;

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
    );
    const nodes: Text[] = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n as Text);

    nodes.forEach((node) => {
      const text = node.nodeValue || "";
      if (!text.trim()) return;

      const hasDisplay = /\$\$([\s\S]+?)\$\$/.test(text);
      const hasInline = /\$([^\$]+?)\$/.test(text);

      if (hasDisplay || hasInline) {
        const span = document.createElement("span");
        let newHtml = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        newHtml = newHtml.replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => {
          try {
            return katex.renderToString(tex, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return m;
          }
        });

        newHtml = newHtml.replace(/\$([^\$]+?)\$/g, (m, tex) => {
          try {
            return katex.renderToString(tex, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return m;
          }
        });

        span.innerHTML = newHtml;
        node.parentNode?.replaceChild(span, node);
      }
    });
  };

  useEffect(() => {
    if (!result) return;
    // Debounce render math
    const timer = setTimeout(() => {
      if (solutionRef.current) renderMathSafe(solutionRef.current);
      if (aiRef.current) renderMathSafe(aiRef.current);
    }, 100);
    return () => clearTimeout(timer);
  }, [result, config, aiExplanation, theme]);

  // Handlers
  const handlePresetChange = (key: string) => setConfig(PRESETS[key]);

  const handleAskAI = async () => {
    if (!result) return;
    setIsLoadingAi(true);
    const text = await explainBeamProblem(config, result);
    setAiExplanation(text);
    setIsLoadingAi(false);
  };

  // Export & Report Handlers
  const handleExportExcel = () => result && exportToExcel(config, result);

  const handleAddToReport = async () => {
    if (!result) return;
    setIsCapturing(true);
    let images = { beam: "", charts: "" };

    try {
      const beamEl = document.getElementById("visualizer-section");
      const chartsEl = document.getElementById("charts-section");
      const opts = {
        scale: 2,
        backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
      };

      if (beamEl) {
        const canvas = await html2canvas(beamEl, opts);
        images.beam = canvas.toDataURL("image/png");
      }
      if (chartsEl) {
        const canvas = await html2canvas(chartsEl, opts);
        images.charts = canvas.toDataURL("image/png");
      }
    } catch (e) {
      console.error("Capture failed", e);
      alert(
        "Gagal mengambil gambar layar, namun data teks akan tetap disimpan.",
      );
    }

    const newItem: ReportItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      config: JSON.parse(JSON.stringify(config)),
      result: JSON.parse(JSON.stringify(result)),
      solutionText: generateStepByStepSolution(config),
      images,
    };

    setReportQueue((prev) => [...prev, newItem]);
    setIsCapturing(false);

    setTimeout(() => {
      document
        .getElementById("report-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleExportWordReport = () => exportToWord(reportQueue, includeImages);
  const handleClearReport = () => confirm("Hapus semua?") && setReportQueue([]);

  // Load/Support Helpers
  const addLoad = () => {
    const newLoad: Load = {
      id: `l-${Date.now()}`,
      type: LoadType.POINT,
      position: config.length / 2,
      magnitude: 10,
      length: 0,
    };
    setConfig((prev) => ({ ...prev, loads: [...prev.loads, newLoad] }));
  };
  const updateLoad = (id: string, updates: Partial<Load>) => {
    setConfig((prev) => ({
      ...prev,
      loads: prev.loads.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };
  const removeLoad = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      loads: prev.loads.filter((l) => l.id !== id),
    }));
  };
  const addSupport = () => {
    const newSupport: Support = {
      id: `s-${Date.now()}`,
      type: SupportType.PIN,
      position: 0,
    };
    setConfig((prev) => ({
      ...prev,
      supports: [...prev.supports, newSupport],
    }));
  };
  const updateSupport = (id: string, updates: Partial<Support>) => {
    setConfig((prev) => ({
      ...prev,
      supports: prev.supports.map((s) =>
        s.id === id ? { ...s, ...updates } : s,
      ),
    }));
  };
  const removeSupport = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      supports: prev.supports.filter((s) => s.id !== id),
    }));
  };

  const renderBeamCalculator = () => (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes slow-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes subtle-pulse {
          0%,
          100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
            filter: brightness(1.2);
          }
        }
        .animate-float {
          animation: slow-float 4s ease-in-out infinite;
        }
        .animate-subtle-pulse {
          animation: subtle-pulse 3s ease-in-out infinite;
        }
      `}</style>
      <Accordion
        type="multiple"
        defaultValue={[
          "item-1",
          "item-2",
          "item-3",
          "item-4",
          "item-5",
          "item-6",
        ]}
        className="space-y-4"
      >
        {/* 1. Header & Configuration Panel */}
        <AccordionItem
          value="item-1"
          className="bg-card overflow-hidden rounded-xl border shadow-sm"
        >
          {/* Preset Selector - Outside Trigger to avoid button nesting */}
          <div className="border-b px-4 py-3 sm:px-6 sm:py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="preset-select"
                className="text-muted-foreground text-sm font-medium"
              >
                Pilih Soal Preset:
              </label>
              <Select onValueChange={handlePresetChange} defaultValue="4.3-1">
                <SelectTrigger
                  id="preset-select"
                  className="w-full sm:w-[200px]"
                >
                  <SelectValue placeholder="Pilih Soal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="empty">Custom (Kosong)</SelectItem>
                  <SelectItem value="4.3-1">Soal 4.3-1</SelectItem>
                  <SelectItem value="4.3-2">Soal 4.3-2</SelectItem>
                  <SelectItem value="4.3-4">Soal 4.3-4</SelectItem>
                  <SelectItem value="4.3-7">Soal 4.3-7</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AccordionTrigger className="px-4 py-3 transition-colors hover:bg-slate-50/50 hover:no-underline sm:px-6 sm:py-4 dark:hover:bg-slate-900/50">
            <div className="flex items-center gap-2 text-left text-lg font-bold sm:text-xl">
              <span className="animate-float flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-600 text-xs text-white shadow-sm shadow-indigo-500/30">
                1
              </span>
              Konfigurasi Soal
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t p-0">
            <div className="p-3 sm:p-6">
              <CardContent className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-12">
                {/* Left: Global Settings */}
                <div className="space-y-6 lg:col-span-4">
                  {/* Geometry Panel */}
                  <div className="space-y-6 rounded-xl border border-indigo-100/50 bg-linear-to-br from-indigo-50/80 via-white to-blue-50/30 p-5 shadow-sm dark:from-indigo-950/30 dark:via-slate-900/50 dark:to-slate-900">
                    <div className="mb-2 flex items-center gap-2 border-b border-indigo-100 pb-2 dark:border-indigo-900/30">
                      <span className="animate-subtle-pulse h-8 w-1 rounded-full bg-linear-to-b from-indigo-500 to-blue-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                      <h3 className="font-bold text-indigo-900 dark:text-indigo-100">
                        Geometri Balok
                      </h3>
                    </div>

                    {/* Unit Settings */}
                    <div className="grid grid-cols-2 gap-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-indigo-700 uppercase dark:text-indigo-300">
                          Satuan Panjang
                        </Label>
                        <Select
                          value={config.unitLength}
                          onValueChange={(v) =>
                            setConfig({ ...config, unitLength: v })
                          }
                        >
                          <SelectTrigger className="h-7 border-indigo-200 bg-white text-xs dark:border-indigo-800 dark:bg-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="m">Meter (m)</SelectItem>
                            <SelectItem value="cm">Centimeter (cm)</SelectItem>
                            <SelectItem value="mm">Milimeter (mm)</SelectItem>
                            <SelectItem value="ft">Feet (ft)</SelectItem>
                            <SelectItem value="in">Inch (in)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-indigo-700 uppercase dark:text-indigo-300">
                          Satuan Gaya
                        </Label>
                        <Select
                          value={config.unitForce}
                          onValueChange={(v) =>
                            setConfig({ ...config, unitForce: v })
                          }
                        >
                          <SelectTrigger className="h-7 border-indigo-200 bg-white text-xs dark:border-indigo-800 dark:bg-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kN">KiloNewton (kN)</SelectItem>
                            <SelectItem value="N">Newton (N)</SelectItem>
                            <SelectItem value="kgf">
                              Kilogram-force (kgf)
                            </SelectItem>
                            <SelectItem value="ton">Ton (ton)</SelectItem>
                            <SelectItem value="kips">Kips</SelectItem>
                            <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
                        Panjang Total ({config.unitLength})
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={config.length}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              length: Number(e.target.value),
                            })
                          }
                          className="border-indigo-200 bg-white font-mono focus-visible:ring-indigo-500 dark:border-indigo-800 dark:bg-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold tracking-wide text-indigo-700 uppercase dark:text-indigo-300">
                          Tumpuan (Supports)
                        </Label>
                        <Button
                          onClick={addSupport}
                          size="sm"
                          variant="outline"
                          className="h-7 border-indigo-200 text-xs hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900"
                        >
                          <Plus className="mr-1 h-3 w-3" /> Add
                        </Button>
                      </div>
                      <div className="custom-scrollbar -mx-2 max-h-[300px] space-y-3 overflow-y-auto p-2">
                        {config.supports.map((s, idx) => (
                          <div
                            key={s.id}
                            className="group relative space-y-3 rounded-lg border border-indigo-100/50 bg-white p-3 shadow-sm transition-all duration-500 hover:z-10 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] dark:border-indigo-900/50 dark:bg-slate-900 dark:hover:border-indigo-700"
                          >
                            <div className="animate-subtle-pulse absolute top-3 bottom-3 left-0 w-1 rounded-r bg-linear-to-b from-indigo-400 to-cyan-400 opacity-70 transition-opacity group-hover:opacity-100"></div>
                            <Button
                              onClick={() => removeSupport(s.id)}
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-destructive absolute top-1 right-1 h-6 w-6 transition-colors duration-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>

                            <div className="flex items-center gap-3 pl-2">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                {idx + 1}
                              </span>
                              <Select
                                value={s.type}
                                onValueChange={(val) =>
                                  updateSupport(s.id, {
                                    type: val as SupportType,
                                  })
                                }
                              >
                                <SelectTrigger className="h-7 w-[140px] border-indigo-100 bg-transparent text-xs dark:border-indigo-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={SupportType.PIN}>
                                    PIN (Sendi)
                                  </SelectItem>
                                  <SelectItem value={SupportType.ROLLER}>
                                    ROLLER (Rol)
                                  </SelectItem>
                                  <SelectItem value={SupportType.FIXED}>
                                    FIXED (Jepit)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2 pl-2">
                              <div className="flex items-center justify-between gap-2">
                                <Label className="text-muted-foreground text-xs font-medium">
                                  Posisi
                                </Label>
                                <div className="gap- 1.5 flex items-center">
                                  <Input
                                    type="number"
                                    value={s.position}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (
                                        !isNaN(val) &&
                                        val >= 0 &&
                                        val <= config.length
                                      ) {
                                        updateSupport(s.id, { position: val });
                                      }
                                    }}
                                    className="h-7 w-16 font-mono text-xs"
                                    step="0.1"
                                    min="0"
                                    max={config.length}
                                  />
                                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                                    {config.unitLength}
                                  </span>
                                </div>
                              </div>
                              <Slider
                                value={[s.position]}
                                max={config.length}
                                step={0.1}
                                className="cursor-grab py-1 active:cursor-grabbing"
                                onValueChange={(val) =>
                                  updateSupport(s.id, { position: val[0] })
                                }
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Load Editor */}
                <div className="space-y-4 lg:col-span-8">
                  <div className="h-full rounded-xl border border-rose-100/50 bg-linear-to-br from-rose-50/80 via-white to-orange-50/30 p-5 shadow-sm dark:from-rose-950/30 dark:via-slate-900/50 dark:to-slate-900">
                    <div className="mb-6 flex items-center justify-between border-b border-rose-100 pb-2 dark:border-rose-900/30">
                      <div className="flex items-center gap-2">
                        <span className="animate-subtle-pulse h-8 w-1 rounded-full bg-linear-to-b from-rose-500 to-orange-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
                        <h3 className="font-bold text-rose-900 dark:text-rose-100">
                          Konfigurasi Beban
                        </h3>
                      </div>
                      <Button
                        onClick={addLoad}
                        size="sm"
                        className="border-0 bg-linear-to-r from-rose-600 to-orange-600 text-white shadow-md shadow-rose-200 transition-all duration-300 hover:scale-105 hover:from-rose-500 hover:to-orange-500 dark:shadow-rose-900/20"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Beban
                      </Button>
                    </div>

                    <div className="custom-scrollbar -mx-2 max-h-[512px] space-y-3 overflow-y-auto p-2">
                      {config.loads.length === 0 && (
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-rose-200/50 bg-white/50 py-12 text-rose-400/60 dark:border-rose-900/30 dark:bg-slate-900/20 dark:text-rose-400/40">
                          <p className="font-medium">
                            Belum ada beban yang diterapkan.
                          </p>
                          <Button
                            variant="link"
                            className="text-rose-500"
                            onClick={addLoad}
                          >
                            Klik untuk tambah
                          </Button>
                        </div>
                      )}
                      {config.loads.map((l, idx) => (
                        <div
                          key={l.id}
                          className="border-border/60 group relative rounded-xl border bg-white p-5 shadow-sm transition-all duration-500 hover:z-10 hover:translate-y-[-2px] hover:border-rose-300 hover:shadow-[0_8px_25px_-5px_rgba(244,63,94,0.25)] dark:bg-slate-900 dark:hover:border-rose-700"
                        >
                          <div className="animate-subtle-pulse absolute top-4 bottom-4 left-0 w-1 rounded-r bg-linear-to-b from-rose-400 to-orange-400 opacity-80 transition-all duration-500 group-hover:opacity-100 group-hover:shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                          <Button
                            onClick={() => removeLoad(l.id)}
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground absolute top-2 right-2 h-7 w-7 rounded-full transition-all duration-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
                            {/* Type & Mag */}
                            <div className="space-y-4 md:col-span-5">
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                  Tipe Beban
                                </Label>
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                                    {idx + 1}
                                  </span>
                                  <Select
                                    value={l.type}
                                    onValueChange={(val) =>
                                      updateLoad(l.id, {
                                        type: val as LoadType,
                                        length:
                                          val === LoadType.POINT
                                            ? 0
                                            : l.length || 2,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-9 w-full text-xs font-medium">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={LoadType.POINT}>
                                        Titik (Point)
                                      </SelectItem>
                                      <SelectItem value={LoadType.DISTRIBUTED}>
                                        Merata (Uniform)
                                      </SelectItem>
                                      <SelectItem value={LoadType.TRIANGULAR}>
                                        Segitiga (Triangular)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                                  Besar ({config.unitForce})
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    className="h-9 border-rose-100 pl-3 font-mono text-sm focus-visible:ring-rose-500 dark:border-rose-900/50"
                                    value={l.magnitude}
                                    onChange={(e) =>
                                      updateLoad(l.id, {
                                        magnitude: Number(e.target.value),
                                      })
                                    }
                                  />
                                  <span className="text-muted-foreground pointer-events-none absolute top-2.5 right-3 text-xs">
                                    {config.unitForce}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Position & Length */}
                            <div className="space-y-5 pt-1 md:col-span-7">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Posisi Start
                                  </Label>
                                  <div className="flex items-center gap-1.5">
                                    <Input
                                      type="number"
                                      value={l.position}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (
                                          !isNaN(val) &&
                                          val >= 0 &&
                                          val <= config.length
                                        ) {
                                          updateLoad(l.id, { position: val });
                                        }
                                      }}
                                      className="h-7 w-16 font-mono text-xs"
                                      step="0.1"
                                      min="0"
                                      max={config.length}
                                    />
                                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                                      {config.unitLength}
                                    </span>
                                  </div>
                                </div>
                                <Slider
                                  value={[l.position]}
                                  max={config.length}
                                  step={0.1}
                                  className="[&>.slider-thumb]:border-rose-500 [&>.slider-track>.slider-range]:bg-rose-500"
                                  onValueChange={(val) =>
                                    updateLoad(l.id, { position: val[0] })
                                  }
                                />
                              </div>

                              {l.type !== LoadType.POINT && (
                                <div className="space-y-2 border-t border-dashed border-rose-100 pt-2 dark:border-rose-800/50">
                                  <div className="flex items-center justify-between gap-2">
                                    <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                      Panjang Beban
                                    </Label>
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        value={l.length || 0}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          const maxLen =
                                            config.length - l.position;
                                          if (
                                            !isNaN(val) &&
                                            val >= 0.1 &&
                                            val <= maxLen
                                          ) {
                                            updateLoad(l.id, { length: val });
                                          }
                                        }}
                                        className="h-7 w-16 font-mono text-xs"
                                        step="0.1"
                                        min="0.1"
                                        max={config.length - l.position}
                                      />
                                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                                        {config.unitLength}
                                      </span>
                                    </div>
                                  </div>
                                  <Slider
                                    value={[l.length || 0]}
                                    min={0.1}
                                    max={config.length - l.position}
                                    step={0.1}
                                    className="[&>.slider-thumb]:border-orange-500 [&>.slider-track>.slider-range]:bg-orange-500"
                                    onValueChange={(val) =>
                                      updateLoad(l.id, { length: val[0] })
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Visualization Panel */}
        <AccordionItem
          value="item-2"
          className="bg-card overflow-hidden rounded-xl border border-blue-100/50 shadow-sm dark:border-blue-900/50"
        >
          <AccordionTrigger className="bg-linear-to-r from-blue-50/50 to-transparent px-4 py-3 hover:no-underline sm:px-6 sm:py-4 dark:from-blue-950/20">
            <div className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <span
                className="animate-float flex h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-600 text-xs text-white shadow-sm shadow-blue-500/30"
                style={{ animationDelay: "0.5s" }}
              >
                2
              </span>
              Visualisasi & Hasil
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t p-0">
            <div className="p-3 sm:p-6">
              <CardContent className="pt-6">
                <BeamVisualizer config={config} isDarkMode={isDarkMode} />

                {/* Results Summary */}
                {result && (
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
                    <div className="group relative overflow-hidden rounded-xl border border-emerald-100/50 bg-linear-to-br from-emerald-50 to-teal-50 p-4 text-center shadow-sm transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] sm:p-5 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-teal-950/30">
                      <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-emerald-400 to-teal-400 opacity-60"></div>
                      <div className="mb-2 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                        Reaksi Tumpuan
                      </div>
                      <div className="relative z-10 flex flex-wrap justify-center gap-4">
                        {Object.entries(result.reactions).map(([key, val]) => (
                          <div
                            key={key}
                            className="rounded border border-emerald-100 bg-white/60 px-3 py-1 dark:border-emerald-900/30 dark:bg-slate-900/60"
                          >
                            <span className="mr-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {key}:
                            </span>
                            <span className="font-mono font-bold text-emerald-800 dark:text-emerald-200">
                              {(val as number).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl border border-rose-100/50 bg-linear-to-br from-rose-50 to-red-50 p-4 text-center shadow-sm transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)] sm:p-5 dark:border-rose-900/50 dark:from-rose-950/30 dark:to-red-950/30">
                      <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-rose-400 to-red-400 opacity-60"></div>
                      <div className="mb-1 text-xs font-bold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                        Gaya Geser Maks (Vmax)
                      </div>
                      <div className="text-2xl font-bold text-rose-700 drop-shadow-sm sm:text-3xl dark:text-rose-300">
                        {result.maxShear.toFixed(2)}{" "}
                        <span className="text-sm font-medium text-rose-500/70">
                          {config.unitForce}
                        </span>
                      </div>
                    </div>
                    <div className="group relative overflow-hidden rounded-xl border border-blue-100/50 bg-linear-to-br from-blue-50 to-indigo-50 p-4 text-center shadow-sm transition-all duration-500 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] sm:p-5 dark:border-blue-900/50 dark:from-blue-950/30 dark:to-indigo-950/30">
                      <div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-blue-400 to-indigo-400 opacity-60"></div>
                      <div className="mb-1 text-xs font-bold tracking-wider text-blue-600 uppercase dark:text-blue-400">
                        Momen Maks (Mmax)
                      </div>
                      <div className="text-2xl font-bold text-blue-700 drop-shadow-sm sm:text-3xl dark:text-blue-300">
                        {result.maxMoment.toFixed(2)}{" "}
                        <span className="text-sm font-medium text-blue-500/70">
                          {config.unitForce}·{config.unitLength}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Charts */}
        {result && (
          <AccordionItem
            value="item-3"
            className="bg-card overflow-hidden rounded-xl border shadow-sm"
          >
            <AccordionTrigger className="px-4 py-3 hover:no-underline sm:px-6 sm:py-4">
              <div className="flex items-center gap-2 text-base font-bold sm:text-lg">
                <span
                  className="animate-float flex h-6 w-6 shrink-0 items-center justify-center rounded bg-rose-600 text-xs text-white shadow-sm shadow-rose-500/30"
                  style={{ animationDelay: "0.7s" }}
                >
                  3
                </span>
                Diagram Gaya Dalam (SFD & BMD)
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t p-0">
              <div className="p-3 sm:p-6">
                <div
                  id="charts-section"
                  className="grid grid-cols-1 gap-6 md:grid-cols-2"
                >
                  <Card className="overflow-hidden border-rose-200/50 shadow-sm transition-shadow duration-500 hover:shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)] dark:border-rose-900/30">
                    <CardHeader className="bg-linear-to-r from-rose-50/50 to-transparent pb-2 dark:from-rose-950/10">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="h-5 w-1 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                        Diagram Gaya Geser (SFD)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.points}>
                            <defs>
                              <linearGradient
                                id="colorShear"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#ef4444"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#ef4444"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={isDarkMode ? "#334155" : "#e5e7eb"}
                            />
                            <XAxis
                              dataKey="x"
                              type="number"
                              domain={[0, config.length]}
                              tickFormatter={(v: any) => Number(v).toFixed(1)}
                              stroke={isDarkMode ? "#94a3b8" : "#666"}
                              fontSize={11}
                            />
                            <YAxis
                              label={{
                                value: `V`,
                                angle: -90,
                                position: "insideLeft",
                                fill: isDarkMode ? "#94a3b8" : "#666",
                                fontSize: 10,
                              }}
                              stroke={isDarkMode ? "#94a3b8" : "#666"}
                              fontSize={11}
                            />
                            <Tooltip
                              formatter={(val: any) => Number(val).toFixed(2)}
                              contentStyle={{
                                backgroundColor: isDarkMode
                                  ? "#1e293b"
                                  : "#fff",
                                borderColor: isDarkMode ? "#334155" : "#ccc",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}
                            />
                            <ReferenceLine
                              y={0}
                              stroke={isDarkMode ? "#94a3b8" : "#000"}
                            />
                            <Area
                              type="linear"
                              dataKey="shear"
                              stroke="#ef4444"
                              strokeWidth={2}
                              fill="url(#colorShear)"
                              baseValue={0}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-blue-200/50 shadow-sm transition-shadow duration-500 hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)] dark:border-blue-900/30">
                    <CardHeader className="bg-linear-to-r from-blue-50/50 to-transparent pb-2 dark:from-blue-950/10">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span className="h-5 w-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                        Diagram Momen Lentur (BMD)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.points}>
                            <defs>
                              <linearGradient
                                id="colorMoment"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#3b82f6"
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={isDarkMode ? "#334155" : "#e5e7eb"}
                            />
                            <XAxis
                              dataKey="x"
                              type="number"
                              domain={[0, config.length]}
                              tickFormatter={(v: any) => Number(v).toFixed(1)}
                              stroke={isDarkMode ? "#94a3b8" : "#666"}
                              fontSize={11}
                            />
                            <YAxis
                              label={{
                                value: `M`,
                                angle: -90,
                                position: "insideLeft",
                                fill: isDarkMode ? "#94a3b8" : "#666",
                                fontSize: 10,
                              }}
                              stroke={isDarkMode ? "#94a3b8" : "#666"}
                              fontSize={11}
                            />
                            <Tooltip
                              formatter={(val: any) => Number(val).toFixed(2)}
                              contentStyle={{
                                backgroundColor: isDarkMode
                                  ? "#1e293b"
                                  : "#fff",
                                borderColor: isDarkMode ? "#334155" : "#ccc",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                              }}
                            />
                            <ReferenceLine
                              y={0}
                              stroke={isDarkMode ? "#94a3b8" : "#000"}
                            />
                            <Area
                              type="linear"
                              dataKey="moment"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              fill="url(#colorMoment)"
                              baseValue={0}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 4. Manual Calculation */}
        <AccordionItem
          value="item-4"
          className="bg-card overflow-hidden rounded-xl border border-orange-100/50 shadow-sm dark:border-orange-900/30"
        >
          <AccordionTrigger className="bg-linear-to-r from-orange-50/50 to-transparent px-4 py-3 hover:no-underline sm:px-6 sm:py-4 dark:from-orange-950/20">
            <div className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <span
                className="animate-float flex h-6 w-6 shrink-0 items-center justify-center rounded bg-orange-500 text-xs text-white shadow-sm shadow-orange-500/30"
                style={{ animationDelay: "1s" }}
              >
                4
              </span>
              <span className="line-clamp-1">
                Perhitungan Manual (Auto-Generated)
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t p-0">
            <div className="p-3 sm:p-6">
              <div
                ref={solutionRef}
                className="prose prose-sm prose-slate dark:prose-invert max-w-none rounded-xl border border-orange-100/50 bg-linear-to-b from-orange-50/30 to-white p-4 shadow-inner sm:p-6 dark:border-orange-900/30 dark:from-slate-900 dark:to-slate-900/50"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdownWithMath(
                    generateStepByStepSolution(config),
                  ),
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Export & Report Section */}

        <AccordionItem
          value="item-5"
          id="report-section"
          className="bg-card border-border overflow-hidden rounded-xl border shadow-sm dark:bg-transparent"
        >
          <AccordionTrigger className="bg-linear-to-r from-purple-50/50 to-transparent px-4 py-3 hover:no-underline sm:px-6 sm:py-4 dark:from-purple-950/20">
            <div className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <span
                className="animate-float flex h-6 w-6 shrink-0 items-center justify-center rounded bg-purple-600 text-xs text-white shadow-sm shadow-purple-500/30"
                style={{ animationDelay: "1.5s" }}
              >
                5
              </span>
              Ekspor & Laporan
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t p-0">
            <div className="p-3 sm:p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="border-b border-purple-100 pb-2 font-bold text-purple-900 dark:border-purple-900/30 dark:text-purple-100">
                    Aksi Soal Ini
                  </h3>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleExportExcel}
                      variant="default"
                      className="w-full justify-start bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-emerald-500 hover:to-teal-500"
                    >
                      <Download className="mr-2 h-4 w-4" /> Export Excel
                      (Single)
                    </Button>
                    <Button
                      onClick={handleAddToReport}
                      disabled={isCapturing}
                      variant="secondary"
                      className="w-full justify-start border border-purple-100 bg-white transition-all duration-300 hover:border-purple-400 dark:border-purple-900 dark:bg-slate-800 dark:hover:border-purple-600"
                    >
                      {isCapturing ? (
                        <span className="mr-2 animate-spin">⏳</span>
                      ) : (
                        <Plus className="mr-2 h-4 w-4 text-purple-600" />
                      )}
                      Tambah ke Laporan Gabungan
                    </Button>
                    <p className="text-muted-foreground rounded border border-purple-100 bg-purple-50/50 p-2 text-xs dark:border-purple-900/30 dark:bg-purple-900/10">
                      Gunakan "Tambah ke Laporan" untuk mengumpulkan beberapa
                      soal sebelum diekspor ke Word.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-linear-to-br from-slate-50 to-white p-5 shadow-inner dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300">
                      Isi Laporan Gabungan
                    </h3>
                    <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-bold text-purple-700 shadow-sm dark:bg-purple-900/50 dark:text-purple-300">
                      {reportQueue.length} Soal
                    </span>
                  </div>

                  {reportQueue.length === 0 ? (
                    <div className="text-muted-foreground rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm italic dark:border-slate-800 dark:bg-slate-900/20">
                      Laporan masih kosong. <br /> Tambahkan soal di sebelah
                      kiri.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="custom-scrollbar max-h-32 space-y-2 overflow-y-auto pr-2">
                        {reportQueue.map((item, idx) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 text-sm shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
                          >
                            <span className="font-medium text-slate-700 dark:text-slate-200">
                              Soal #{idx + 1} ({item.config.length}m)
                            </span>
                            <span className="text-muted-foreground rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-900">
                              {item.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="includeImg"
                            checked={includeImages}
                            onChange={(e) => setIncludeImages(e.target.checked)}
                            className="bg-background border-input h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <label
                            htmlFor="includeImg"
                            className="cursor-pointer text-sm text-slate-600 select-none dark:text-slate-400"
                          >
                            Sertakan Gambar Grafik
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleExportWordReport}
                            className="flex-1 bg-linear-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:from-purple-500 hover:to-indigo-500"
                          >
                            <Save className="mr-2 h-4 w-4" /> Unduh Word
                          </Button>
                          <Button
                            onClick={handleClearReport}
                            variant="destructive"
                            size="icon"
                            className="shadow-md shadow-red-500/20 transition-transform hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. AI Tutor */}
        <AccordionItem
          value="item-6"
          className="bg-card relative overflow-hidden rounded-xl border border-violet-500/50 bg-linear-to-br from-violet-600 to-indigo-900 text-white shadow-sm transition-all duration-500 hover:shadow-violet-500/20"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline sm:px-6 sm:py-4">
            <div className="flex w-full flex-col items-center justify-between gap-3 sm:gap-4 md:flex-row">
              <div>
                <div className="flex items-center gap-2 text-xl font-bold text-white sm:text-2xl">
                  <span className="animate-pulse text-yellow-300">✨</span>{" "}
                  Asisten Dosen AI
                </div>
                <div className="mt-1 text-left text-xs font-normal text-violet-200 sm:text-sm">
                  Bingung caranya? Minta AI jelaskan langkah-langkah
                  penyelesaian soal ini secara lebih mendalam.
                </div>
              </div>
              {/* Button inside trigger can be tricky. We should prevent propagation if we want it clickable, 
                OR better: Move button to content. But user might want it visible.
                For now I'll just render it as visual or move to Content.
                Actually, the button "Tanya Dosen AI" triggers the action.
                If I put it in content, user has to open accordion first.
                Let's put it in Content to avoid nesting interactive elements in summary.
            */}
              <div className="text-xs text-violet-200">(Klik untuk Buka)</div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-violet-500/30 p-0">
            <div className="p-3 sm:p-6">
              <div className="mb-4 flex justify-end">
                <Button
                  onClick={handleAskAI}
                  disabled={isLoadingAi}
                  size="lg"
                  variant="secondary"
                  className="bg-white text-violet-900 shadow-md transition-transform hover:scale-105 hover:bg-violet-50"
                >
                  {isLoadingAi ? "Sedang Berpikir..." : "Tanya Dosen AI"}
                </Button>
              </div>
              {aiExplanation ? (
                <div
                  ref={aiRef}
                  className="prose prose-invert max-w-none rounded-lg border border-violet-400/30 bg-black/30 p-6 backdrop-blur-sm"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdownWithMath(aiExplanation),
                  }}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-violet-400/30 bg-white/10 p-6 text-center text-violet-200 backdrop-blur-sm">
                  Klik tombol di atas untuk mendapatkan penjelasan personal dari
                  AI.
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <div className="w-full pb-10 font-sans transition-colors">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl">
              MekaBahan <span className="text-blue-600">Solver Pro</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Analisis Struktur & Mekanika Bahan
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Tabs
              defaultValue="beam"
              className="w-full max-w-[400px]"
              onValueChange={(val) => setActiveTab(val as "beam" | "inertia")}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="beam">Analisis Balok</TabsTrigger>
                <TabsTrigger value="inertia">Properti Penampang</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {activeTab === "beam" ? (
            renderBeamCalculator()
          ) : (
            <InertiaCalculator />
          )}
        </main>
      </div>
    </div>
  );
};

export default MekbanSolver;
