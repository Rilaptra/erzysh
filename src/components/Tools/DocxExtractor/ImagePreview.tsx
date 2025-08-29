// src/components/Tools/DocxExtractor/ImagePreview.tsx
import Image from "next/image";
import type { SelectedImage } from "@/types";

interface ImagePreviewProps {
  images: SelectedImage[];
}

export const ImagePreview = ({ images }: ImagePreviewProps) => {
  if (images.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="dark:text-off-white font-semibold text-gray-700">
        Gambar yang Ditemukan ({images.length}):
      </h3>
      <div className="grid max-h-64 grid-cols-3 gap-4 overflow-y-auto rounded-lg bg-gray-100 p-4 sm:grid-cols-4 md:grid-cols-6 dark:bg-gray-800/50">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
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
  );
};
