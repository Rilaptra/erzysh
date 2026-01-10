/*
  _____  ______   _______   _   _ _   _ _     
 |  __ \|  _ \ \ / /_   _| | | | | | (_) |    
 | |__) | | | \ V /  | |   | | | | |_ _| |___ 
 |  ___/| | | |> <   | |   | | | | __| | / __|
 | |    | |/ /| . \ _| |_  | |_| | |_| | \__ \
 |_|    |___/ |_|\_\_____|  \___/ \__|_|_|___/
                                              
 [ CORE LOGIC UTILITIES - LOCAL WORKER FIX ]
*/

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const getPdfJs = async () => {
  if (typeof window === "undefined") return null;

  const pdfjs = await import("pdfjs-dist");

  // Pointer ke local file di folder public
  // Ini lebih reliable & hemat bandwidth buat spek laptop RAM 8GB lu
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  return pdfjs;
};

export const renderPageToBlob = async (
  fileData: ArrayBuffer,
  pageIndex: number,
  scale = 0.5,
): Promise<string> => {
  const pdfjs = await getPdfJs();
  if (!pdfjs) return "";

  try {
    const loadingTask = pdfjs.getDocument({ data: fileData });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIndex + 1);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas Context Failed");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas,
    }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          // 🧹 Memory Cleanup
          canvas.width = 0;
          canvas.height = 0;
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            resolve("");
          }
        },
        "image/jpeg",
        0.8,
      ); // 0.8 is a sweet spot for quality/size
    });
  } catch (error) {
    console.error("PDF Render Error:", error);
    return "";
  }
};

export const createPdfFromImages = async (imageFiles: File[]) => {
  const pdfDoc = await PDFDocument.create();

  for (const file of imageFiles) {
    const buffer = await file.arrayBuffer();
    const isPng = file.name.toLowerCase().endsWith("png");

    // Embed image (Heavy op, handled carefully)
    const image = isPng
      ? await pdfDoc.embedPng(buffer)
      : await pdfDoc.embedJpg(buffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return await pdfDoc.save();
};

// ✨ The "Eryzsh" Touch: Whiteout Logic
export const applyWhiteout = async (
  pdfDoc: PDFDocument,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  const { height: pageHeight } = page.getSize();

  // Koordinat PDF.js (Top-Left) beda sama pdf-lib (Bottom-Left)
  // Kita harus flip Y-axis
  const pdfY = pageHeight - y - height;

  page.drawRectangle({
    x,
    y: pdfY,
    width,
    height,
    color: rgb(1, 1, 1), // PUTIH BERSIH
  });
};

export const addTextOverlay = async (
  pdfDoc: PDFDocument,
  pageIndex: number,
  text: string,
  x: number,
  y: number,
  size: number = 12,
) => {
  const pages = pdfDoc.getPages();
  const page = pages[pageIndex];
  const { height: pageHeight } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Flip Y-axis logic again
  const pdfY = pageHeight - y - size; // Adjustment kasar buat baseline

  page.drawText(text, {
    x,
    y: pdfY,
    size,
    font,
    color: rgb(0, 0, 0),
  });
};
