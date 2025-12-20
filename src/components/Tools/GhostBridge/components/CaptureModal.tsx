import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

interface CaptureModalProps {
  isOpen: boolean;
  onOpenChange: (val: boolean) => void;
  screenshot: string | null;
}

export const CaptureModal = ({
  isOpen,
  onOpenChange,
  screenshot,
}: CaptureModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl border-white/5 bg-neutral-950/90 p-1 backdrop-blur-2xl">
        <div className="rounded-xl bg-black/40 p-2 lg:p-4">
          <DialogHeader className="mb-4 flex flex-row items-center justify-between px-2 pt-2">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,1)]" />
              <DialogTitle className="font-mono text-[11px] font-black tracking-[0.3em] text-neutral-400 uppercase">
                Remote Viewport Synchronization
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/5 bg-[#050505] shadow-2xl">
            {screenshot ? (
              <Image
                src={
                  screenshot.startsWith("http")
                    ? screenshot
                    : `data:image/png;base64,${screenshot}`
                }
                alt="Remote System Surface"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <RefreshCw className="h-10 w-10 animate-spin text-teal-500/20" />
                  <span className="font-mono text-[10px] tracking-widest text-neutral-600 uppercase">
                    Decoding Visual Buffer...
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-2 px-2 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a");
                link.href = screenshot?.startsWith("http")
                  ? screenshot
                  : `data:image/png;base64,${screenshot}`;
                link.download = `GhostView_${new Date().getTime()}.png`;
                link.click();
              }}
              className="h-8 border-white/5 bg-white/5 text-[9px] font-black tracking-widest uppercase"
            >
              Dump Memory
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-[9px] font-black tracking-widest uppercase"
            >
              Close Viewport
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
