// src/components/Tools/PdfLite/index.tsx
"use client";

import {
  Eraser,
  FileText,
  Loader2,
  MousePointer2,
  Save,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import { usePdfLite } from "./usePdfLite";

export default function PdfLite() {
  const {
    loadPdf,
    savePdf,
    fileUrl,
    pageThumbnails,
    currentPage,
    handlePageChange,
    isProcessing,
    handleApplyEdit,
    mode,
    setMode,
    scale,
    setScale,
  } = usePdfLite();

  const [textInput, setTextInput] = useState("Sample Text");
  const imgRef = useRef<HTMLImageElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === "view" || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const visualScale = imgRef.current.naturalWidth / imgRef.current.width;
    const pdfX = x * visualScale * 0.75;
    const pdfY = y * visualScale * 0.75;

    if (mode === "whiteout") {
      handleApplyEdit(pdfX, pdfY, 100, 20);
    } else if (mode === "text") {
      handleApplyEdit(pdfX, pdfY, 0, 0, textInput);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-background text-foreground">
      {/* 🟢 TOOLBAR / HEADER */}
      <header className="flex h-14 items-center justify-between border-b bg-card/50 px-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <h1 className="hidden font-bold tracking-tight sm:block">
            PDF <span className="font-light text-primary">Lite</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {fileUrl && (
            <>
              <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
                <ToolBtn
                  icon={MousePointer2}
                  active={mode === "view"}
                  onClick={() => setMode("view")}
                  label="Select"
                />
                <ToolBtn
                  icon={Eraser}
                  active={mode === "whiteout"}
                  onClick={() => setMode("whiteout")}
                  label="Whiteout"
                />
                <ToolBtn
                  icon={Type}
                  active={mode === "text"}
                  onClick={() => setMode("text")}
                  label="Text"
                />
              </div>

              {mode === "text" && (
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="h-8 w-32 text-xs md:w-48"
                  placeholder="Ketik teks..."
                />
              )}

              <Separator orientation="vertical" className="mx-1 h-6" />

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="min-w-[40px] text-center font-mono text-xs">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!fileUrl ? (
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) =>
                  e.target.files?.[0] && loadPdf(e.target.files[0])
                }
              />
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" /> Open PDF
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={savePdf}
              className="shadow-lg shadow-primary/20"
            >
              <Save className="mr-2 h-4 w-4" /> Export
            </Button>
          )}
        </div>
      </header>

      {/* 🔵 MAIN CONTENT */}
      <main className="flex flex-1 overflow-hidden">
        {/* SIDEBAR (Thumbnails) */}
        {fileUrl && (
          <aside className="hidden w-56 border-r bg-card/30 md:block">
            <ScrollArea className="h-full px-4 py-6">
              <div className="space-y-4">
                {pageThumbnails.map((thumb, idx) => (
                  <div
                    key={idx}
                    onClick={() => handlePageChange(idx)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all hover:ring-2 hover:ring-primary/20",
                      currentPage === idx
                        ? "border-primary shadow-md"
                        : "border-transparent opacity-60 hover:opacity-100",
                    )}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`P${idx + 1}`}
                        className="w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[3/4] items-center justify-center bg-muted animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute bottom-0 w-full bg-background/80 py-1 text-center text-[10px] backdrop-blur-sm">
                      Halaman {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* WORKSPACE AREA */}
        <div className="relative flex flex-1 flex-col items-center overflow-auto bg-muted/20 p-4 md:p-8">
          {isProcessing && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Processing PDF...
                </span>
              </div>
            </div>
          )}

          {fileUrl ? (
            <div
              className={cn(
                "relative origin-top bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-transform duration-200 ease-out dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
                mode === "view" ? "cursor-default" : "cursor-crosshair",
              )}
              style={{ transform: `scale(${scale})` }}
              onClick={handleCanvasClick}
            >
              <img
                ref={imgRef}
                src={fileUrl}
                alt="Current Page"
                className="max-w-none rounded-sm"
                style={{ minHeight: "800px" }}
              />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground/40">
              <div className="mb-6 rounded-full bg-muted p-8">
                <Upload className="h-12 w-12" />
              </div>
              <p className="font-mono text-sm tracking-tight">
                Drop PDF file here to start editing
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const ToolBtn = ({
  icon: Icon,
  active,
  onClick,
  label,
}: {
  icon: any;
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <Button
    size="icon"
    variant={active ? "default" : "ghost"}
    className={cn(
      "h-8 w-8 transition-all",
      active ? "shadow-sm" : "text-muted-foreground",
    )}
    onClick={onClick}
    title={label}
  >
    <Icon className="h-4 w-4" />
  </Button>
);
