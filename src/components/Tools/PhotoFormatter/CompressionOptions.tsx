// src/components/Tools/PhotoFormatter/CompressionOptions.tsx
import { Label } from "@/components/ui/label";

interface CompressionOptionsProps {
  quality: number;
  onQualityChange: (quality: number) => void;
}

export const CompressionOptions = ({
  quality,
  onQualityChange,
}: CompressionOptionsProps) => (
  <div className="w-full max-w-md space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
    <div className="flex items-center justify-between">
      <Label
        htmlFor="quality-slider"
        className="font-semibold text-gray-800 dark:text-gray-200"
      >
        Kualitas Gambar
      </Label>
      <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
        {(quality * 100).toFixed(0)}%
      </span>
    </div>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      Kualitas lebih rendah akan menghasilkan ukuran file yang jauh lebih kecil.
    </p>
    <input
      id="quality-slider"
      type="range"
      min="0.1"
      max="1.0"
      step="0.05"
      value={quality}
      onChange={(e) => onQualityChange(parseFloat(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-gray-700 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600"
    />
  </div>
);
