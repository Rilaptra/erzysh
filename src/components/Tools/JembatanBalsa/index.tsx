// src/components/Tools/JembatanBalsa/index.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import {
  Ruler,
  Weight,
  Play,
  RotateCcw,
  Trash2,
  MousePointer2,
  Construction,
  AlertTriangle,
  Monitor,
  TrendingUp,
  Square,
  Settings,
  Gauge,
  Activity,
  Calculator,
  Grid,
  ScanLine,
  Eraser, // Icon baru
} from "lucide-react";
import { cn } from "@/lib/cn";
import { BlockMath } from "react-katex";

// --- TYPES ---
type Point = { x: number; y: number; id: string; isSupport?: boolean };
type Member = {
  from: string;
  to: string;
  id: string;
  type: "balsa" | "string";
};

type BridgeConfig = {
  // Design Params
  span: number; // cm
  balsaWidth: number; // mm
  balsaHeight: number; // mm

  // Load Params
  load: number; // kg
  loadType: "point" | "distributed";
  loadLength: number; // cm

  // Visualization Constants (Editable)
  gridSize: number; // px (Default 20)
  scaleFactor: number; // cm per grid unit (Default 5)

  // Simulation Constants (Advanced Settings)
  materialE: number; // MPa
  failLimit: number; // MPa
  maxLoadLimit: number; // kg
  autoLoadStep: number; // kg
  autoTickSpeed: number; // ms
};

// --- CONSTANTS (Fixed Layout) ---
const CANVAS_HEIGHT = 500;
const GROUND_LEVEL_Y = CANVAS_HEIGHT - 100;

// --- HELPER MATH ---
function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number },
) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(
    p.x - (v.x + t * (w.x - v.x)),
    p.y - (v.y + t * (w.y - v.y)),
  );
}

export default function JembatanBalsaClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default Config
  const [config, setConfig] = useState<BridgeConfig>({
    span: 60,
    balsaWidth: 10,
    balsaHeight: 10,
    load: 0,
    loadType: "point",
    loadLength: 20,
    // Visualization Defaults
    gridSize: 20,
    scaleFactor: 5,
    // Simulation Defaults
    materialE: 4000,
    failLimit: 15,
    maxLoadLimit: 100,
    autoLoadStep: 0.5,
    autoTickSpeed: 50,
  });

  const [nodes, setNodes] = useState<Point[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<"select" | "node" | "member" | "delete">(
    "node",
  );
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0, id: "cursor" });

  const [simulationResult, setSimulationResult] = useState<{
    deflection: number;
    stress: number;
    passed: boolean;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isAutoTesting, setIsAutoTesting] = useState(false);

  // --- INITIALIZATION ---
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Init default bridge on mount
    initDefaultBridge(config);

    return () => window.removeEventListener("resize", checkMobile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DEFAULT BRIDGE GENERATOR ---
  const initDefaultBridge = (currentConfig: BridgeConfig = config) => {
    const widthPx = 800;
    const centerX = widthPx / 2;
    const spanPx =
      (currentConfig.span / currentConfig.scaleFactor) * currentConfig.gridSize;
    const trussHeightPx = currentConfig.gridSize * 4;

    const pLeft: Point = {
      x: centerX - spanPx / 2,
      y: GROUND_LEVEL_Y,
      id: "support-left",
      isSupport: true,
    };
    const pRight: Point = {
      x: centerX + spanPx / 2,
      y: GROUND_LEVEL_Y,
      id: "support-right",
      isSupport: true,
    };

    const seg = 4;
    const segWidth = spanPx / seg;
    const bottomNodes: Point[] = [];
    for (let i = 1; i < seg; i++) {
      bottomNodes.push({
        x: pLeft.x + segWidth * i,
        y: GROUND_LEVEL_Y,
        id: `b-${i}`,
      });
    }

    const topNodes: Point[] = [];
    for (let i = 0; i < seg; i++) {
      topNodes.push({
        x: pLeft.x + segWidth * i + segWidth / 2,
        y: GROUND_LEVEL_Y - trussHeightPx,
        id: `t-${i}`,
      });
    }

    const allNodes = [pLeft, pRight, ...bottomNodes, ...topNodes];
    const newMembers: Member[] = [];

    const bottomLine = [pLeft, ...bottomNodes, pRight];
    for (let i = 0; i < bottomLine.length - 1; i++) {
      newMembers.push({
        from: bottomLine[i].id,
        to: bottomLine[i + 1].id,
        id: `bm-${i}`,
        type: "balsa",
      });
    }
    for (let i = 0; i < topNodes.length - 1; i++) {
      newMembers.push({
        from: topNodes[i].id,
        to: topNodes[i + 1].id,
        id: `tm-${i}`,
        type: "balsa",
      });
    }
    bottomLine.forEach((bNode, i) => {
      if (topNodes[i])
        newMembers.push({
          from: bNode.id,
          to: topNodes[i].id,
          id: `d1-${i}`,
          type: "balsa",
        });
      if (i > 0 && topNodes[i - 1])
        newMembers.push({
          from: bNode.id,
          to: topNodes[i - 1].id,
          id: `d2-${i}`,
          type: "balsa",
        });
    });
    const lastTop = topNodes[topNodes.length - 1];
    newMembers.push({
      from: lastTop.id,
      to: pRight.id,
      id: `d-end`,
      type: "balsa",
    });

    setNodes(allNodes);
    setMembers(newMembers);
    setSimulationResult(null);
    setConfig((prev) => ({ ...prev, load: 0 }));
  };

  // --- CLEAR ALL ---
  const clearAll = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua node dan batang?")) {
      setNodes([]);
      setMembers([]);
      setSimulationResult(null);
      toast.success("Kanvas dibersihkan.");
    }
  };

  // --- PHYSICS CALCULATION ---
  const calculatePhysics = (
    currentLoad: number,
    currentConfig: BridgeConfig,
  ) => {
    const L_mm = currentConfig.span * 10;
    const P_N = currentLoad * 9.81;

    const I =
      (currentConfig.balsaWidth * Math.pow(currentConfig.balsaHeight, 3)) / 12;
    const E = currentConfig.materialE;

    let maxMoment = 0;
    let deflection = 0;

    if (currentConfig.loadType === "point") {
      maxMoment = (P_N * L_mm) / 4;
      deflection = (P_N * Math.pow(L_mm, 3)) / (48 * E * I);
    } else {
      const ratio = Math.min(1, currentConfig.loadLength / currentConfig.span);
      const factor = 4 + 4 * (1 - ratio);
      maxMoment = (P_N * L_mm) / factor;
      deflection = (5 * P_N * Math.pow(L_mm, 3)) / (384 * E * I);
    }

    const y = currentConfig.balsaHeight / 2;
    const stress = (maxMoment * y) / I;
    const passed = stress <= currentConfig.failLimit;

    return { deflection, stress, passed };
  };

  // --- AUTO TEST LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isAutoTesting) {
      interval = setInterval(() => {
        setConfig((prev) => {
          const nextLoad = prev.load + prev.autoLoadStep;
          const result = calculatePhysics(nextLoad, prev);
          setSimulationResult(result);

          if (!result.passed) {
            setIsAutoTesting(false);
            toast.error(
              `STRUKTUR RUNTUH pada beban ${nextLoad.toFixed(2)} kg!`,
              {
                description: `Tegangan mencapai ${result.stress.toFixed(2)} MPa`,
              },
            );
            return prev;
          }

          if (nextLoad >= prev.maxLoadLimit) {
            setIsAutoTesting(false);
            toast.success(`Kapasitas Maksimum Alat Tercapai.`);
            return { ...prev, load: prev.maxLoadLimit };
          }

          return { ...prev, load: nextLoad };
        });
      }, config.autoTickSpeed);
    }
    return () => clearInterval(interval);
  }, [isAutoTesting, config.autoTickSpeed]);

  const runSingleTest = () => {
    const result = calculatePhysics(config.load, config);
    setSimulationResult(result);
    if (result.passed)
      toast.success(`Aman. Tegangan: ${result.stress.toFixed(2)} MPa`);
    else toast.error(`Gagal. Tegangan: ${result.stress.toFixed(2)} MPa`);
  };

  // --- CANVAS DRAWING ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear & Sky
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradSky = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradSky.addColorStop(0, "#f0f9ff");
    gradSky.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = document.documentElement.classList.contains("dark")
      ? "#0f172a"
      : gradSky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate dynamic pixel values
    const spanPx = (config.span / config.scaleFactor) * config.gridSize;
    const centerX = canvas.width / 2;
    const leftBankX = centerX - spanPx / 2;
    const rightBankX = centerX + spanPx / 2;

    // Environment (Ground & River)
    ctx.fillStyle = "#65a30d";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_LEVEL_Y);
    ctx.lineTo(leftBankX, GROUND_LEVEL_Y);
    ctx.lineTo(leftBankX, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(rightBankX, GROUND_LEVEL_Y);
    ctx.lineTo(canvas.width, GROUND_LEVEL_Y);
    ctx.lineTo(canvas.width, CANVAS_HEIGHT);
    ctx.lineTo(rightBankX, CANVAS_HEIGHT);
    ctx.fill();

    ctx.fillStyle = "#3b82f6";
    ctx.globalAlpha = 0.6;
    ctx.fillRect(
      leftBankX,
      GROUND_LEVEL_Y + 40,
      spanPx,
      CANVAS_HEIGHT - (GROUND_LEVEL_Y + 40),
    );
    ctx.globalAlpha = 1.0;

    // Dynamic Grid
    ctx.strokeStyle = document.documentElement.classList.contains("dark")
      ? "#ffffff10"
      : "#00000010";
    ctx.lineWidth = 0.5;
    // Gunakan config.gridSize
    for (let x = 0; x <= canvas.width; x += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Members
    members.forEach((member) => {
      const n1 = nodes.find((n) => n.id === member.from);
      const n2 = nodes.find((n) => n.id === member.to);
      if (n1 && n2) {
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.lineWidth = Math.max(2, config.balsaHeight / 2);
        let color = "#d97706";
        if (simulationResult)
          color = simulationResult.passed ? "#22c55e" : "#ef4444";
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.fillStyle = "#78350f";
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n2.x, n2.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // Nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.isSupport ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle =
        node.id === selectedNode
          ? "#eab308"
          : node.isSupport
            ? "#2563eb"
            : "#fcd34d";
      ctx.fill();
      ctx.stroke();
      if (node.isSupport) {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y + 8);
        ctx.lineTo(node.x - 8, node.y + 20);
        ctx.lineTo(node.x + 8, node.y + 20);
        ctx.closePath();
        ctx.fillStyle = "#475569";
        ctx.fill();
      }
    });

    // Load Visual
    if (config.load > 0) {
      const loadCenterY = GROUND_LEVEL_Y;
      ctx.fillStyle = "#dc2626";
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.font = "bold 12px sans-serif";
      if (config.loadType === "point") {
        ctx.beginPath();
        ctx.moveTo(centerX, loadCenterY - 60);
        ctx.lineTo(centerX, loadCenterY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX - 5, loadCenterY - 10);
        ctx.lineTo(centerX, loadCenterY);
        ctx.lineTo(centerX + 5, loadCenterY - 10);
        ctx.fill();
        ctx.fillText(
          `P = ${config.load.toFixed(1)} kg`,
          centerX + 10,
          loadCenterY - 40,
        );
      } else {
        const loadLenPx =
          (config.loadLength / config.scaleFactor) * config.gridSize;
        const startX = centerX - loadLenPx / 2;
        ctx.fillStyle = "rgba(220, 38, 38, 0.2)";
        ctx.fillRect(startX, loadCenterY - 30, loadLenPx, 30);
        ctx.strokeRect(startX, loadCenterY - 30, loadLenPx, 30);
        ctx.fillStyle = "#dc2626";
        ctx.fillText(
          `Total = ${config.load.toFixed(1)} kg`,
          centerX - 40,
          loadCenterY - 40,
        );
      }
    }

    // Preview
    if (mode === "node" || (mode === "member" && selectedNode)) {
      ctx.beginPath();
      ctx.arc(mousePos.x, mousePos.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      if (mode === "member" && selectedNode) {
        const start = nodes.find((n) => n.id === selectedNode);
        if (start) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(mousePos.x, mousePos.y);
          ctx.strokeStyle = "#94a3b8";
          ctx.setLineDash([5, 5]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }
  }, [nodes, members, config, selectedNode, mousePos, mode, simulationResult]);

  useEffect(() => {
    draw();
  }, [draw]);

  // --- INTERACTION HANDLERS ---
  const getSnappedPos = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const snapX = Math.round(rawX / config.gridSize) * config.gridSize;
    const snapY = Math.round(rawY / config.gridSize) * config.gridSize;
    const existingNode = nodes.find(
      (n) => Math.hypot(n.x - snapX, n.y - snapY) < config.gridSize / 2,
    );
    return { x: snapX, y: snapY, existingId: existingNode?.id, rawX, rawY };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isAutoTesting) return;
    const { x, y, existingId, rawX, rawY } = getSnappedPos(e);

    if (mode === "node") {
      if (!existingId)
        setNodes((prev) => [...prev, { x, y, id: `node-${Date.now()}` }]);
    } else if (mode === "member") {
      if (existingId) {
        if (selectedNode === null) setSelectedNode(existingId);
        else {
          if (selectedNode !== existingId) {
            const exists = members.some(
              (m) =>
                (m.from === selectedNode && m.to === existingId) ||
                (m.from === existingId && m.to === selectedNode),
            );
            if (!exists)
              setMembers((prev) => [
                ...prev,
                {
                  from: selectedNode,
                  to: existingId,
                  id: `mem-${Date.now()}`,
                  type: "balsa",
                },
              ]);
            setSelectedNode(null);
          }
        }
      } else setSelectedNode(null);
    } else if (mode === "delete") {
      if (existingId) {
        const node = nodes.find((n) => n.id === existingId);
        if (node?.isSupport) return toast.error("Tumpuan tidak boleh dihapus!");
        setNodes((prev) => prev.filter((n) => n.id !== existingId));
        setMembers((prev) =>
          prev.filter((m) => m.from !== existingId && m.to !== existingId),
        );
        return;
      }
      const clickedMember = members.find((m) => {
        const n1 = nodes.find((n) => n.id === m.from);
        const n2 = nodes.find((n) => n.id === m.to);
        if (!n1 || !n2) return false;
        return distToSegment({ x: rawX, y: rawY }, n1, n2) < 8;
      });
      if (clickedMember)
        setMembers((prev) => prev.filter((m) => m.id !== clickedMember.id));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x, y } = getSnappedPos(e);
    setMousePos({ x, y, id: "cursor" });
  };

  const handleParamChange = (field: keyof BridgeConfig, value: string) => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) return;

    // Reset jika parameter vital berubah drastis
    if (
      (field === "span" || field === "gridSize" || field === "scaleFactor") &&
      numVal !== config[field]
    ) {
      // Optional: Auto reset or warn
    }
    setConfig((prev) => ({ ...prev, [field]: numVal }));
  };

  return (
    <main className="container mx-auto max-w-7xl px-4 py-8">
      {isMobile && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
          <div>
            <p className="font-bold">Rekomendasi Perangkat</p>
            <p className="text-sm">
              Gunakan Laptop/PC Desktop untuk pengalaman desain jembatan yang
              lebih presisi.
            </p>
          </div>
        </div>
      )}

      <header className="mb-8 text-center">
        <h1 className="text-foreground flex items-center justify-center gap-3 text-3xl font-bold">
          <Construction className="text-teal-muted h-8 w-8" />
          Simulator Jembatan Balsa
        </h1>
        <p className="text-muted-foreground mt-2">
          Desain rangka batang, atur beban, dan uji kekuatan struktur secara
          real-time.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* --- PANEL KONTROL --- */}
        <Card className="order-2 h-fit backdrop-blur-sm lg:order-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="text-primary h-5 w-5" /> Parameter Desain
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* BASIC INPUTS */}
            <div className="space-y-1.5">
              <Label htmlFor="span">Bentang Jembatan (x) - cm</Label>
              <Input
                id="span"
                type="number"
                value={config.span}
                onChange={(e) => handleParamChange("span", e.target.value)}
                disabled={isAutoTesting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="balsaWidth">Lebar (a) mm</Label>
                <Input
                  id="balsaWidth"
                  type="number"
                  value={config.balsaWidth}
                  onChange={(e) =>
                    handleParamChange("balsaWidth", e.target.value)
                  }
                  disabled={isAutoTesting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="balsaHeight">Tinggi (b) mm</Label>
                <Input
                  id="balsaHeight"
                  type="number"
                  value={config.balsaHeight}
                  onChange={(e) =>
                    handleParamChange("balsaHeight", e.target.value)
                  }
                  disabled={isAutoTesting}
                />
              </div>
            </div>

            <div className="bg-border my-4 h-px w-full" />

            {/* LOAD INPUTS */}
            <h3 className="flex items-center gap-2 font-semibold">
              <Weight className="h-4 w-4" /> Konfigurasi Beban
            </h3>

            <Tabs
              defaultValue="point"
              value={config.loadType}
              onValueChange={(v) =>
                setConfig((prev) => ({ ...prev, loadType: v as any }))
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="point" disabled={isAutoTesting}>
                  Beban Titik
                </TabsTrigger>
                <TabsTrigger value="distributed" disabled={isAutoTesting}>
                  Beban Merata
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="load">Total Beban Uji (P) - kg</Label>
              <Input
                id="load"
                type="number"
                value={config.load}
                onChange={(e) => handleParamChange("load", e.target.value)}
                disabled={isAutoTesting}
                className={cn(
                  isAutoTesting && "border-red-500 font-bold text-red-500",
                )}
              />
            </div>

            {config.loadType === "distributed" && (
              <div className="space-y-1.5">
                <Label htmlFor="loadLength">Panjang Beban (L) - cm</Label>
                <Input
                  id="loadLength"
                  type="number"
                  value={config.loadLength}
                  max={config.span}
                  onChange={(e) =>
                    handleParamChange("loadLength", e.target.value)
                  }
                  disabled={isAutoTesting}
                />
              </div>
            )}

            {/* --- ADVANCED SETTINGS ACCORDION --- */}
            <Accordion
              type="single"
              collapsible
              className="w-full rounded-md border px-2"
            >
              <AccordionItem value="advanced" className="border-b-0">
                <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" /> Pengaturan Lanjutan
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {/* --- GRID & SCALE SETTINGS (New) --- */}
                  <div className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                    <Grid className="h-3 w-3" /> Visualisasi (Grid & Skala)
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="gridSize" className="text-xs">
                        Snap Grid (px)
                      </Label>
                      <Input
                        id="gridSize"
                        type="number"
                        value={config.gridSize}
                        min={10}
                        step={5}
                        onChange={(e) =>
                          handleParamChange("gridSize", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="scaleFactor" className="text-xs">
                        Skala (cm/grid)
                      </Label>
                      <Input
                        id="scaleFactor"
                        type="number"
                        value={config.scaleFactor}
                        min={1}
                        step={1}
                        onChange={(e) =>
                          handleParamChange("scaleFactor", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-border h-px w-full" />

                  <div className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                    <ScanLine className="h-3 w-3" /> Parameter Material
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="materialE" className="text-xs">
                        Modulus Young (MPa)
                      </Label>
                      <Input
                        id="materialE"
                        type="number"
                        value={config.materialE}
                        onChange={(e) =>
                          handleParamChange("materialE", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="failLimit" className="text-xs">
                        Batas Izin (MPa)
                      </Label>
                      <Input
                        id="failLimit"
                        type="number"
                        value={config.failLimit}
                        onChange={(e) =>
                          handleParamChange("failLimit", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="bg-border h-px w-full" />
                  <div className="text-muted-foreground flex items-center gap-1 text-xs font-semibold">
                    <Gauge className="h-3 w-3" /> Parameter Alat Uji (Auto)
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="maxLoadLimit" className="text-xs">
                      Kapasitas Maksimum Alat (kg)
                    </Label>
                    <Input
                      id="maxLoadLimit"
                      type="number"
                      value={config.maxLoadLimit}
                      onChange={(e) =>
                        handleParamChange("maxLoadLimit", e.target.value)
                      }
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="autoLoadStep" className="text-xs">
                        Step Beban (kg)
                      </Label>
                      <Input
                        id="autoLoadStep"
                        type="number"
                        value={config.autoLoadStep}
                        step={0.1}
                        onChange={(e) =>
                          handleParamChange("autoLoadStep", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="autoTickSpeed" className="text-xs">
                        Kecepatan (ms)
                      </Label>
                      <Input
                        id="autoTickSpeed"
                        type="number"
                        value={config.autoTickSpeed}
                        step={10}
                        min={10}
                        onChange={(e) =>
                          handleParamChange("autoTickSpeed", e.target.value)
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* BUTTONS */}
            <div className="space-y-3 pt-2">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                onClick={runSingleTest}
                disabled={isAutoTesting}
              >
                <Play className="mr-2 h-4 w-4" /> Cek Kekuatan (Manual)
              </Button>

              <Button
                className={cn(
                  "w-full text-white transition-colors",
                  isAutoTesting
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-indigo-600 hover:bg-indigo-700",
                )}
                onClick={() => {
                  if (isAutoTesting) setIsAutoTesting(false);
                  else {
                    setConfig((p) => ({ ...p, load: 0 })); // Reset start
                    setIsAutoTesting(true);
                  }
                }}
              >
                {isAutoTesting ? (
                  <>
                    <Square className="mr-2 h-4 w-4 fill-current" /> Stop Uji
                    Runtuh
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" /> Uji Runtuh (Auto)
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => initDefaultBridge(config)}
                disabled={isAutoTesting}
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Desain (Default)
              </Button>
            </div>

            {/* RESULT CARD WITH LATEX FORMULAS */}
            {simulationResult && (
              <div
                className={cn(
                  "animate-in zoom-in-95 mt-4 rounded-lg border p-4 transition-colors duration-300",
                  simulationResult.passed
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-red-500/50 bg-red-500/10",
                )}
              >
                {/* --- FORMULA SECTION --- */}
                <div className="border-border/50 mb-4 border-b pb-4">
                  <h5 className="text-muted-foreground mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Calculator className="h-4 w-4" /> Perhitungan Teoretis
                  </h5>
                  <div className="space-y-2 overflow-x-auto text-xs">
                    {/* Common Formulas */}
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground/70 font-bold">
                        Momen Inersia (I):
                      </span>
                      <BlockMath
                        math={`I = \\frac{b \\cdot h^3}{12} = \\frac{${config.balsaWidth} \\cdot ${config.balsaHeight}^3}{12}`}
                      />
                    </div>

                    {/* Load Specific Formulas */}
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground/70 font-bold">
                        Momen Maksimum (M<sub>max</sub>) & Lendutan ($\delta$):
                      </span>
                      {config.loadType === "point" ? (
                        <>
                          <BlockMath
                            math={`M_{max} = \\frac{P \\cdot L}{4} = \\frac{${(config.load * 9.81).toFixed(1)} \\cdot ${config.span * 10}}{4}`}
                          />
                          <BlockMath
                            math={`\\delta = \\frac{P \\cdot L^3}{48 \\cdot E \\cdot I}`}
                          />
                        </>
                      ) : (
                        <>
                          <BlockMath
                            math={`M_{max} \\approx \\frac{P_{total} \\cdot L}{8} \\quad (Approximation)`}
                          />
                          <BlockMath
                            math={`\\delta \\approx \\frac{5 \\cdot P_{total} \\cdot L^3}{384 \\cdot E \\cdot I}`}
                          />
                        </>
                      )}
                    </div>

                    {/* Stress Formula */}
                    <div className="flex flex-col gap-1">
                      <span className="text-foreground/70 font-bold">
                        Tegangan Lentur ($\sigma$):
                      </span>
                      <BlockMath
                        math={`\\sigma = \\frac{M_{max} \\cdot (h/2)}{I} \\le \\sigma_{izin}`}
                      />
                    </div>
                  </div>
                </div>

                <h4
                  className={cn(
                    "mb-2 flex items-center gap-2 font-bold",
                    simulationResult.passed ? "text-green-600" : "text-red-600",
                  )}
                >
                  {simulationResult.passed
                    ? "✅ STRUKTUR AMAN"
                    : "❌ STRUKTUR GAGAL"}
                </h4>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <span className="text-muted-foreground">Lendutan:</span>
                  <span className="font-mono">
                    {simulationResult.deflection.toFixed(3)} mm
                  </span>
                  <span className="text-muted-foreground">Tegangan:</span>
                  <span className="font-mono">
                    {simulationResult.stress.toFixed(2)} MPa
                  </span>
                  <span className="text-muted-foreground col-span-2 mt-1 flex items-center gap-1 text-xs italic opacity-70">
                    <Activity className="h-3 w-3" /> Batas Izin:{" "}
                    {config.failLimit} MPa
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- VISUALIZATION AREA --- */}
        <div className="order-1 space-y-4 lg:order-2 lg:col-span-2">
          <div className="bg-card border-border flex flex-wrap gap-2 rounded-lg border p-2 shadow-sm">
            <div className="border-border mr-2 flex items-center gap-2 border-r px-2">
              <Monitor className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-semibold">Editor</span>
            </div>
            <Button
              variant={mode === "node" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("node")}
              disabled={isAutoTesting}
            >
              <MousePointer2 className="mr-2 h-4 w-4" /> Node
            </Button>
            <Button
              variant={mode === "member" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("member")}
              disabled={isAutoTesting}
            >
              <Construction className="mr-2 h-4 w-4" /> Batang
            </Button>
            <Button
              variant={mode === "delete" ? "destructive" : "ghost"}
              size="sm"
              onClick={() => setMode("delete")}
              disabled={isAutoTesting}
              className={
                mode === "delete"
                  ? ""
                  : "text-destructive hover:bg-destructive/10"
              }
            >
              <Trash2 className="mr-2 h-4 w-4" /> Hapus
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isAutoTesting}
              className="text-muted-foreground hover:text-foreground"
            >
              <Eraser className="mr-2 h-4 w-4" /> Bersihkan
            </Button>
            <div className="text-muted-foreground ml-auto hidden self-center text-xs sm:block">
              {mode === "delete"
                ? "Klik titik atau batang untuk menghapus"
                : `Snap: ${config.gridSize}px | Skala: 1:${config.scaleFactor}`}
            </div>
          </div>

          <div className="border-border relative h-[500px] w-full cursor-crosshair overflow-hidden rounded-xl border-2 bg-slate-50 shadow-inner dark:bg-slate-900">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="block h-full w-full"
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
              onMouseLeave={() =>
                setMousePos((prev) => ({ ...prev, x: -100, y: -100 }))
              }
            />
            <div className="bg-background/90 pointer-events-none absolute bottom-4 left-4 space-y-2 rounded border p-3 text-xs shadow-sm backdrop-blur-sm">
              <div className="font-bold">Legenda</div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border border-white bg-blue-600"></div>{" "}
                Tumpuan
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border border-black/20 bg-yellow-400"></div>{" "}
                Node (Sambungan)
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-amber-600"></div> Kayu Balsa
              </div>
              {simulationResult && (
                <div
                  className={cn(
                    "rounded px-2 py-1 text-center font-bold text-white",
                    simulationResult.passed ? "bg-green-500" : "bg-red-500",
                  )}
                >
                  {simulationResult.passed ? "AMAN" : "GAGAL"}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
