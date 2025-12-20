import { Server, Activity, Layers, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeviceStatus } from "../types";

interface DeviceInfoDialogProps {
  isOpen: boolean;
  onOpenChange: (val: boolean) => void;
  device: DeviceStatus | null;
}

export const DeviceInfoDialog = ({
  isOpen,
  onOpenChange,
  device,
}: DeviceInfoDialogProps) => {
  if (!device) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/5 bg-neutral-950/90 p-6 backdrop-blur-3xl">
        <DialogHeader className="mb-6 flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10">
            <Server className="h-6 w-6 text-teal-500" />
          </div>
          <div>
            <DialogTitle className="text-lg font-black tracking-tight text-white uppercase">
              {device.name}
            </DialogTitle>
            <span className="block font-mono text-[10px] text-neutral-500">
              NODE_UPLINK: {device.id}
            </span>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/5 bg-white/2 p-4">
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
              <Activity className="h-3 w-3" />
              <span className="text-[9px] font-black tracking-widest uppercase">
                CPU LOAD
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {device.cpu_usage.toFixed(2)}%
            </div>
            <div className="mt-1 truncate font-mono text-[9px] text-neutral-600">
              {device.cpu_brand}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/2 p-4">
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
              <Layers className="h-3 w-3" />
              <span className="text-[9px] font-black tracking-widest uppercase">
                MEMORY
              </span>
            </div>
            <div className="text-xl font-black text-white">
              {device.ram_usage} MB
            </div>
            <div className="mt-1 font-mono text-[9px] text-neutral-600">
              OF {device.ram_total} MB TOTAL
            </div>
          </div>

          <div className="col-span-2 rounded-xl border border-white/5 bg-white/2 p-4">
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
              <Monitor className="h-3 w-3" />
              <span className="text-[9px] font-black tracking-widest uppercase">
                PLATFORM ARCH
              </span>
            </div>
            <div className="text-sm font-bold text-teal-400 uppercase">
              {device.platform}
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-black text-teal-500 uppercase">
                {device.os_type}
              </span>
              <span className="font-mono text-[10px] tracking-tight text-neutral-600">
                User: {device.user}
              </span>
              <span className="ml-auto rounded border border-teal-500/30 px-1.5 py-0.5 text-[9px] font-black text-teal-400 uppercase">
                v{device.version}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs font-black tracking-widest text-neutral-500 uppercase hover:text-white"
          >
            Close Metrics
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
