// src/components/Tools/PhotoFormatter/GenerationProgress.tsx
import type { ProgressStatus } from "@/types";

interface GenerationProgressProps {
  isLoading: boolean;
  progress: ProgressStatus;
}

export const GenerationProgress = ({
  isLoading,
  progress,
}: GenerationProgressProps) => {
  if (!isLoading) return null;

  return (
    <div className="w-full space-y-2">
      <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <p className="dark:text-off-white/70 text-center text-sm text-gray-600">
        {progress.message}
      </p>
    </div>
  );
};
