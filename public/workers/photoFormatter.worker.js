// public/workers/photoFormatter.worker.js

// Impor skrip eksternal yang dibutuhkan oleh worker
self.importScripts(
  "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js",
  "https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js",
);

self.onmessage = async (event) => {
  const zipFile = event.data;

  try {
    const zip = await JSZip.loadAsync(zipFile);
    const imagePromises = [];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;

      const extension = relativePath
        .toLowerCase()
        .substring(relativePath.lastIndexOf("."));
      if (!imageExtensions.includes(extension)) return;

      const imagePromise = async () => {
        try {
          // Ekstrak sebagai blob
          const imageData = await zipEntry.async("blob");
          return {
            filename: relativePath,
            data: imageData,
            // URL.createObjectURL harus dipanggil di main thread, jadi kita kirim blob-nya saja
          };
        } catch (error) {
          console.error(
            "Worker: Error processing image in zip:",
            relativePath,
            error,
          );
          return null;
        }
      };
      imagePromises.push(imagePromise());
    });

    const processedImagesRaw = (await Promise.all(imagePromises)).filter(
      (img) => img !== null,
    );

    // Buat URL Object di sini (ternyata bisa di worker modern) dan kembalikan
    const finalImages = processedImagesRaw.map((image) => ({
      ...image,
      url: URL.createObjectURL(image.data),
    }));

    self.postMessage({ type: "SUCCESS", payload: finalImages });
  } catch (error) {
    console.error("Worker: Error processing ZIP file:", error);
    self.postMessage({ type: "ERROR", payload: { message: error.message } });
  }
};
