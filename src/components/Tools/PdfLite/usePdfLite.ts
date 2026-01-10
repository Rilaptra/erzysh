import { PDFDocument } from "pdf-lib";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { addTextOverlay, applyWhiteout, renderPageToBlob } from "./utils";

export type EditorMode = "view" | "whiteout" | "text";

export const usePdfLite = () => {
  const pdfDocRef = useRef<PDFDocument | null>(null);

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [pageThumbnails, setPageThumbnails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mode, setMode] = useState<EditorMode>("view");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      pageThumbnails.forEach((url) => URL.revokeObjectURL(url));
      console.log("🧹 [GC] Memory cleared.");
    };
  }, []);

  // usePdfLite.ts - Update pada bagian loadPdf
  const loadPdf = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();

      // Load ke pdf-lib dulu
      const pdfDoc = await PDFDocument.load(buffer);
      pdfDocRef.current = pdfDoc;

      const numPages = pdfDoc.getPageCount();
      const thumbs: string[] = [];

      // ✅ FIX: Gunakan .slice(0) untuk membuat copy buffer agar tidak detached
      // Ini penting banget buat loop thumbnail di bawah
      const firstPageBlob = await renderPageToBlob(buffer.slice(0), 0, 1.0);
      setFileUrl(firstPageBlob);

      const limit = Math.min(numPages, 10);
      for (let i = 0; i < limit; i++) {
        // ✅ FIX: Selalu slice(0) setiap kali masuk ke fungsi render
        const thumbUrl = await renderPageToBlob(buffer.slice(0), i, 0.3);
        if (thumbUrl) thumbs.push(thumbUrl);
      }

      setPageThumbnails(thumbs);
      toast.success(`PDF Loaded: ${numPages} Pages`);
    } catch (e) {
      console.error("Load PDF Error:", e);
      toast.error("Gagal load PDF");
    } finally {
      setIsProcessing(false);
    }
  }, []);
  const handlePageChange = async (index: number) => {
    if (!pdfDocRef.current) return;
    setIsProcessing(true);

    setCurrentPage(index);

    // 🔥 FIX 1: Casting buffer ke ArrayBuffer agar TypeScript tidak komplain
    const pdfBytes = await pdfDocRef.current.save();
    const blobUrl = await renderPageToBlob(
      pdfBytes.buffer as ArrayBuffer,
      index,
      1.5 * scale,
    );

    setFileUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return blobUrl;
    });

    setIsProcessing(false);
  };

  const handleApplyEdit = async (
    x: number,
    y: number,
    w: number,
    h: number,
    text?: string,
  ) => {
    if (!pdfDocRef.current) return;

    if (mode === "whiteout") {
      await applyWhiteout(pdfDocRef.current, currentPage, x, y, w, h);
    } else if (mode === "text" && text) {
      await addTextOverlay(pdfDocRef.current, currentPage, text, x, y);
    }

    await handlePageChange(currentPage);
  };

  const savePdf = async () => {
    if (!pdfDocRef.current) return;
    setIsProcessing(true);
    try {
      const pdfBytes = await pdfDocRef.current.save();

      // 🔥 FIX 2: Casting 'as any' pada array blob untuk bypass error Uint8Array<ArrayBufferLike>
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Eryzsh_Lite_${Date.now()}.pdf`;
      link.click();
      toast.success("File saved! 💾");
    } catch (e) {
      toast.error("Gagal save file");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    fileUrl,
    pageThumbnails,
    currentPage,
    mode,
    setMode,
    isProcessing,
    loadPdf,
    handlePageChange,
    handleApplyEdit,
    savePdf,
    scale,
    setScale,
  };
};
