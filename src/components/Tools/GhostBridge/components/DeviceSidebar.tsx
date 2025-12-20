import {
  Monitor,
  Terminal,
  Cpu,
  Info,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Bell,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/cn";
import { DeviceStatus } from "../types";

interface DeviceSidebarProps {
  devices: DeviceStatus[];
  selectedDevice: DeviceStatus | null;
  setSelectedDevice: (dev: DeviceStatus | null) => void;
  deviceSearch: string;
  setDeviceSearch: (val: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  setSelectedInfoDevice: (dev: DeviceStatus | null) => void;
  setIsInfoOpen: (val: boolean) => void;
  handleRenameDevice: (e: React.MouseEvent, id: string) => void;
  handleDeleteDevice: (e: React.MouseEvent, id: string) => void;
  isNotificationEnabled: boolean;
  isSubscribing: boolean;
  handleSubscribe: () => void;
  handleUnsubscribe: () => void;
}

export const DeviceSidebar = ({
  devices,
  selectedDevice,
  setSelectedDevice,
  deviceSearch,
  setDeviceSearch,
  isSidebarOpen,
  setIsSidebarOpen,
  setSelectedInfoDevice,
  setIsInfoOpen,
  handleRenameDevice,
  handleDeleteDevice,
  isNotificationEnabled,
  isSubscribing,
  handleSubscribe,
  handleUnsubscribe,
}: DeviceSidebarProps) => {
  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(deviceSearch.toLowerCase()) ||
      d.id.toLowerCase().includes(deviceSearch.toLowerCase()),
  );

  return (
    <aside
      className={cn(
        "absolute inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-white/5 bg-neutral-900/60 backdrop-blur-3xl transition-all duration-300 lg:static lg:w-80 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-2 text-neutral-500 lg:hidden"
        onClick={() => setIsSidebarOpen(false)}
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-white uppercase">
              <div className="relative">
                <Monitor className="h-5 w-5 text-teal-400" />
                <div className="absolute -top-1 -right-1 h-2 w-2 animate-ping rounded-full bg-teal-500 opacity-75" />
              </div>
              Ghost
              <span className="text-teal-500">Net</span>
            </h2>
            <p className="mt-1 text-[10px] font-medium tracking-widest text-neutral-500 uppercase">
              {devices.length} Nodes Online
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg border border-white/5 bg-white/5 transition-all hover:bg-white/10",
              isNotificationEnabled &&
                "border-teal-500/30 bg-teal-500/10 text-teal-500 hover:text-teal-400",
            )}
            onClick={
              isNotificationEnabled ? handleUnsubscribe : handleSubscribe
            }
            disabled={isSubscribing}
            title={
              isNotificationEnabled
                ? "Disable Notifications"
                : "Enable Notifications"
            }
          >
            {isSubscribing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isNotificationEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4 text-neutral-500" />
            )}
          </Button>
        </div>

        <div className="group relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <Terminal className="h-3 w-3 text-neutral-600 transition-colors group-focus-within:text-teal-500" />
          </div>
          <input
            type="text"
            placeholder="Scan node ID..."
            className="h-9 w-full rounded-lg border border-white/5 bg-black/40 pr-4 pl-9 font-mono text-xs text-neutral-300 outline-hidden transition-all focus:border-teal-500/50 focus:bg-black/60"
            value={deviceSearch}
            onChange={(e) => setDeviceSearch(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          {filteredDevices.map((dev) => (
            <div
              key={dev.id}
              onClick={() => {
                setSelectedDevice(dev);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-xl border border-white/3 bg-neutral-900/40 p-3 transition-all duration-300 hover:border-white/10 hover:bg-neutral-800/60",
                selectedDevice?.id === dev.id &&
                  "border-teal-500/30 bg-teal-500/5 shadow-[0_0_20px_rgba(20,184,166,0.05)]",
                !dev.is_online && "opacity-60 saturate-0",
              )}
            >
              <div
                className={cn(
                  "absolute top-0 bottom-0 left-0 w-1 transition-all duration-500",
                  dev.is_online ? "bg-teal-500" : "bg-neutral-700",
                  selectedDevice?.id === dev.id
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-50",
                )}
              />

              <div className="mb-2 flex items-center justify-between pl-1">
                <span className="text-xs font-bold tracking-tight text-white uppercase transition-colors group-hover:text-teal-300">
                  {dev.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      dev.is_online
                        ? "bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,1)]"
                        : "bg-neutral-700",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-black tracking-tighter",
                      dev.is_online ? "text-teal-500" : "text-neutral-600",
                    )}
                  >
                    {dev.is_online ? "CONNECTED" : "OFFLINE"}
                  </span>
                </div>
              </div>

              <div className="truncate pl-1 font-mono text-[9px] text-neutral-600 transition-colors group-hover:text-neutral-400">
                {dev.id}
              </div>

              <div className="mt-3 flex items-center justify-between pl-1">
                <div className="flex gap-2 text-[9px] font-bold text-neutral-500 uppercase">
                  <span className="flex items-center gap-1 rounded border border-white/5 bg-black/30 px-1.5 py-0.5">
                    <Cpu className="h-2 w-2" /> {dev.platform.split(" ")[0]}
                  </span>
                </div>

                <div className="flex gap-1 opacity-20 transition-all duration-300 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-white/10 hover:text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedInfoDevice(dev);
                      setIsInfoOpen(true);
                    }}
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-white/10 hover:text-white"
                    onClick={(e) => handleRenameDevice(e, dev.id)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => handleDeleteDevice(e, dev.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {filteredDevices.length === 0 && (
            <div className="p-8 text-center font-mono text-[10px] text-neutral-600 uppercase">
              No nodes found in sector
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};
