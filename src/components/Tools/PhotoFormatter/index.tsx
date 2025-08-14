// File: pages/index.tsx (SOLUSI)
// ---------------------
// 捉窶昨汳ｻ Rizqi Lasheva | 2025
//
// Versi Next.js + TypeScript dari DOCX Generator Tool.
// Kode ini telah diperbarui untuk mendukung Dark Theme dan
// menyertakan input field tambahan untuk nama file.
//
// Pastikan Anda sudah menginstal dependency yang dibutuhkan:
// npm install jszip file-saver lucide-react
// npm install --save-dev @types/jszip @types/file-saver

"use client";

import type { NextPage } from "next";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { saveAs } from "file-saver";

// --- TYPE DEFINITIONS ---
interface SelectedImage {
  filename: string;
  data: Blob;
  url: string;
  base64: string | null;
}

interface FileInfo {
  name: string;
  size: string;
}

interface ProgressStatus {
  percentage: number;
  message: string;
}

interface MessageBox {
  isOpen: boolean;
  title: string;
  text: string;
  isError: boolean;
}

// --- MAIN COMPONENT ---
const DocxGeneratorPage: NextPage = () => {
  // --- STATE MANAGEMENT ---
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [nama, setNama] = useState<string>("");
  const [npm, setNpm] = useState<string>("");
  const [nomor_kelas, setNomorKelas] = useState<string>("");
  const [progress, setProgress] = useState<ProgressStatus>({
    percentage: 0,
    message: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [messageBox, setMessageBox] = useState<MessageBox>({
    isOpen: false,
    title: "",
    text: "",
    isError: false,
  });

  // --- REFS ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- UTILITY FUNCTIONS ---
  const showMessage = (
    title: string,
    text: string,
    isError: boolean = false,
  ) => {
    setMessageBox({ isOpen: true, title, text, isError });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getImageExtension = (filename: string): string => {
    const extension = filename
      .toLowerCase()
      .substring(filename.lastIndexOf(".") + 1);
    return extension === "jpeg" ? "jpg" : extension;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // --- CORE LOGIC ---
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileInfo({ name: file.name, size: formatFileSize(file.size) });
    setSelectedImages([]);

    try {
      const JSZip = (await import("jszip")).default;
      await processZipFile(file, JSZip);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      showMessage(
        "Error Reading ZIP",
        `Gagal memproses file ZIP: ${errorMessage}`,
        true,
      );
    }
  };

  const processZipFile = async (file: File, JSZip: any) => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const imagePromises: Promise<SelectedImage | null>[] = [];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

    zipContent.forEach((relativePath: string, zipEntry: any) => {
      if (zipEntry.dir) return;

      const extension = relativePath
        .toLowerCase()
        .substring(relativePath.lastIndexOf("."));
      if (!imageExtensions.includes(extension)) return;

      const imagePromise = async (): Promise<SelectedImage | null> => {
        try {
          const imageData = await zipEntry.async("blob");
          const imageUrl = URL.createObjectURL(imageData);
          return {
            filename: relativePath,
            data: imageData,
            url: imageUrl,
            base64: null,
          };
        } catch (error) {
          console.error("Error processing image:", relativePath, error);
          return null;
        }
      };
      imagePromises.push(imagePromise());
    });

    const processedImages = (await Promise.all(imagePromises)).filter(
      (img): img is SelectedImage => img !== null,
    );

    if (processedImages.length > 0) {
      setSelectedImages(processedImages);
    } else {
      showMessage(
        "No Images Found",
        "Tidak ada gambar yang ditemukan di dalam file ZIP.",
        false,
      );
    }
  };

  // --- DOCX XML CREATION FUNCTIONS ---
  const createContentTypes = useCallback(
    () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Default Extension="gif" ContentType="image/gif"/><Default Extension="bmp" ContentType="image/bmp"/><Default Extension="webp" ContentType="image/webp"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    [],
  );

  const createMainRels = useCallback(
    () => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    [],
  );

  const createDocumentRels = useCallback((images: SelectedImage[]) => {
    let rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
    images.forEach((image, i) => {
      if (image.base64) {
        const extension = getImageExtension(image.filename);
        rels += `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image${i + 1}.${extension}"/>`;
      }
    });
    rels += `</Relationships>`;
    return rels;
  }, []);

  const createDocument = useCallback((images: SelectedImage[]) => {
    const widthInEMU = 10 * 360000;
    const heightInEMU = 5 * 360000;

    let doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>`;

    images.forEach((image, i) => {
      doc += `<w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:b/><w:sz w:val="24"/></w:rPr><w:t>${i + 1}.</w:t></w:r></w:p>`;
      if (image.base64) {
        doc += `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthInEMU}" cy="${heightInEMU}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${i + 1}" name="Picture ${i + 1}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="0"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${i + 1}" name="${image.filename}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${i + 1}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthInEMU}" cy="${heightInEMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
      } else {
        doc += `<w:p><w:r><w:t>[Error loading image: ${image.filename}]</w:t></w:r></w:p>`;
      }
    });

    doc += `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`;
    doc += `</w:body></w:document>`;
    return doc;
  }, []);

  const generateDocx = async () => {
    if (selectedImages.length === 0) {
      showMessage(
        "No Images",
        "Tidak ada gambar yang dipilih untuk diproses.",
        true,
      );
      return;
    }

    setIsLoading(true);
    setProgress({ percentage: 0, message: "Starting process..." });

    try {
      const JSZip = (await import("jszip")).default;
      // --- PERBAIKAN DI SINI ---
      // 1. Import seluruh modul 'file-saver'

      const imagesWithBase64: SelectedImage[] = [];
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        setProgress({
          percentage: ((i + 1) / selectedImages.length) * 50,
          message: `Processing image ${i + 1} of ${selectedImages.length}...`,
        });
        try {
          const arrayBuffer = await image.data.arrayBuffer();
          image.base64 = arrayBufferToBase64(arrayBuffer);
          imagesWithBase64.push(image);
        } catch (error) {
          console.error("Error converting image:", image.filename, error);
          imagesWithBase64.push({ ...image, base64: null });
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      setProgress({ percentage: 75, message: "Creating DOCX structure..." });
      const docxZip = new JSZip();
      docxZip.file("[Content_Types].xml", createContentTypes());
      docxZip.folder("_rels")?.file(".rels", createMainRels());

      const wordFolder = docxZip.folder("word");
      if (wordFolder) {
        wordFolder.file("document.xml", createDocument(imagesWithBase64));
        wordFolder
          .folder("_rels")
          ?.file("document.xml.rels", createDocumentRels(imagesWithBase64));

        const mediaFolder = wordFolder.folder("media");
        imagesWithBase64.forEach((image, i) => {
          if (image.base64) {
            const extension = getImageExtension(image.filename);
            mediaFolder?.file(`image${i + 1}.${extension}`, image.base64, {
              base64: true,
            });
          }
        });
      }

      setProgress({ percentage: 90, message: "Generating DOCX file..." });
      const blob = await docxZip.generateAsync({ type: "blob" });
      const generated_document = `${nama}_${npm}_${nomor_kelas}`;

      // 2. Gunakan fileSaver.saveAs, bukan hanya saveAs
      saveAs(blob, `${generated_document}.docx`);

      setProgress({
        percentage: 100,
        message: "Done! File has been downloaded.",
      });
      setTimeout(() => setIsLoading(false), 2000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error generating DOCX:", error);
      showMessage(
        "Generation Failed",
        `Terjadi kesalahan saat membuat dokumen: ${errorMessage}`,
        true,
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      selectedImages.forEach((image) => URL.revokeObjectURL(image.url));
    };
  }, [selectedImages]);

  // --- RENDER ---
  return (
    <>
      {/* Dark Theme: Background */}
      <div className="dark:to-dark-shale fixed inset-0 -z-10 bg-gradient-to-br from-purple-200 via-indigo-200 to-blue-200 dark:from-gray-900" />

      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {/* Dark Theme: Main Container */}
        <div className="ring-opacity-5 dark:bg-dark-shale/80 w-full max-w-2xl space-y-6 rounded-2xl bg-white/70 p-8 shadow-2xl ring-1 ring-black backdrop-blur-xl dark:ring-white/10">
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
              DOCX Generator
            </h1>
            {/* Dark Theme: Subtitle Text */}
            <p className="dark:text-off-white/70 mt-2 text-gray-600">
              Upload a ZIP file containing images to generate a DOCX document.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Dark Theme: Input Fields */}
            <Input
              type="text"
              placeholder="Nama"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
            />
            <Input
              type="text"
              placeholder="NPM"
              value={npm}
              onChange={(e) => setNpm(e.target.value)}
              className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
            />
            <Input
              type="text"
              placeholder="Nomor Kelas"
              value={nomor_kelas}
              onChange={(e) => setNomorKelas(e.target.value)}
              className="dark:text-off-white dark:border-gray-600 dark:bg-gray-800 dark:placeholder:text-gray-400"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".zip"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              <Upload className="mr-2 h-5 w-5" />
              Select ZIP File
            </button>
            {fileInfo && (
              // Dark Theme: File Info Box
              <div className="dark:text-off-white w-full rounded-lg border-l-4 border-indigo-500 bg-gray-100 p-4 text-left text-sm dark:border-indigo-400 dark:bg-gray-800/50">
                <p>
                  <strong>File:</strong> {fileInfo.name}
                </p>
                <p>
                  <strong>Size:</strong> {fileInfo.size}
                </p>
              </div>
            )}
          </div>

          {selectedImages.length > 0 && (
            <div className="space-y-2">
              {/* Dark Theme: Preview Title */}
              <h3 className="dark:text-off-white font-semibold text-gray-700">
                Image Preview:
              </h3>
              {/* Dark Theme: Preview Background */}
              <div className="grid max-h-64 grid-cols-3 gap-4 overflow-y-auto rounded-lg bg-gray-100 p-4 sm:grid-cols-4 md:grid-cols-6 dark:bg-gray-800/50">
                {selectedImages.map((image) => (
                  <div key={image.url} className="relative aspect-square">
                    <Image
                      src={image.url}
                      width={256}
                      height={256}
                      alt={image.filename}
                      className="h-full w-full rounded-md object-cover shadow-md"
                    />
                    <div className="absolute bottom-0 w-full truncate rounded-b-md bg-black/50 p-1 text-center text-xs text-white">
                      {image.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={generateDocx}
              disabled={isLoading || selectedImages.length === 0}
              className="w-full rounded-full bg-purple-600 px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-purple-700 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto dark:disabled:bg-gray-600"
            >
              <FileText className="mr-2 inline h-5 w-5" />
              Generate DOCX
            </button>
            {isLoading && (
              <div className="w-full space-y-2">
                {/* Dark Theme: Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                {/* Dark Theme: Progress Text */}
                <p className="dark:text-off-white/70 text-center text-sm text-gray-600">
                  {progress.message}
                </p>
              </div>
            )}
          </div>

          {/* Dark Theme: Note Box */}
          <div className="rounded-r-lg border-l-4 border-yellow-500 bg-yellow-100 p-4 text-sm text-yellow-800 dark:border-yellow-400 dark:bg-yellow-900/30 dark:text-yellow-300">
            <strong>Note:</strong> This tool will create a numbered list in the
            DOCX document, with each number followed by its corresponding image.
          </div>
        </div>

        {/* Dark Theme: Footer Text */}
        <footer className="dark:text-off-white/60 mt-8 text-sm text-gray-600">
          <p>Built with Next.js, TypeScript, JSZip, and FileSaver.js</p>
        </footer>
      </main>

      {messageBox.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          {/* Dark Theme: Modal */}
          <div className="dark:bg-dark-shale w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:ring-1 dark:ring-white/20">
            <div className="flex items-center">
              {messageBox.isError ? (
                <XCircle className="mr-3 h-8 w-8 text-red-500" />
              ) : (
                <CheckCircle className="mr-3 h-8 w-8 text-green-500" />
              )}
              <h3 className="dark:text-off-white text-lg font-bold text-gray-800">
                {messageBox.title}
              </h3>
            </div>
            <p className="dark:text-off-white/80 mt-2 text-sm text-gray-600">
              {messageBox.text}
            </p>
            <button
              onClick={() => setMessageBox({ ...messageBox, isOpen: false })}
              className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DocxGeneratorPage;
