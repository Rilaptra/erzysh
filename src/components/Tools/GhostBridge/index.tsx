"use client";

import {
  Monitor,
  Terminal,
  RefreshCw,
  Menu,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useGhostBridge } from "./hooks/useGhostBridge";
import { AdminGuard } from "./components/AdminGuard";
import { DeviceSidebar } from "./components/DeviceSidebar";
import { FileExplorer } from "./components/FileExplorer";
import { CaptureModal } from "./components/CaptureModal";
import { DeviceInfoDialog } from "./components/DeviceInfoDialog";

export default function GhostBridge() {
  const {
    isDevMode,
    unlockDevMode,
    devices,
    selectedDevice,
    setSelectedDevice,
    currentPath,
    files,
    disks,
    isLoadingFiles,
    passwordInput,
    setPasswordInput,
    screenshot,
    isScreenshotOpen,
    setIsScreenshotOpen,
    deviceSearch,
    setDeviceSearch,
    fileSearch,
    setFileSearch,
    isInfoOpen,
    setIsInfoOpen,
    isUploading,
    selectedInfoDevice,
    setSelectedInfoDevice,
    isSidebarOpen,
    setIsSidebarOpen,
    isMounted,
    fetchDirectory,
    handleScreenshot,
    handleDownloadFile,
    handleUploadFile,
    handleDeleteDevice,
    handleRenameDevice,
    isNotificationEnabled,
    isSubscribing,
    handleSubscribe,
    handleUnsubscribe,
  } = useGhostBridge();

  if (!isMounted) return null;

  if (!isDevMode) {
    return (
      <AdminGuard
        passwordInput={passwordInput}
        setPasswordInput={setPasswordInput}
        onAuthorize={unlockDevMode}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-neutral-100 antialiased selection:bg-teal-500/30">
      <div className="relative flex flex-1 overflow-hidden">
        <DeviceSidebar
          devices={devices}
          selectedDevice={selectedDevice}
          setSelectedDevice={setSelectedDevice}
          deviceSearch={deviceSearch}
          setDeviceSearch={setDeviceSearch}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          setSelectedInfoDevice={setSelectedInfoDevice}
          setIsInfoOpen={setIsInfoOpen}
          handleRenameDevice={handleRenameDevice}
          handleDeleteDevice={handleDeleteDevice}
          isNotificationEnabled={isNotificationEnabled}
          isSubscribing={isSubscribing}
          handleSubscribe={handleSubscribe}
          handleUnsubscribe={handleUnsubscribe}
        />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#050505]">
          {isSidebarOpen && (
            <div
              className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="absolute top-0 right-0 -mt-32 -mr-32 h-96 w-96 rounded-full bg-teal-500/5 blur-[120px]" />

          {selectedDevice ? (
            <>
              <header className="relative z-10 flex h-16 items-center justify-between border-b border-white/5 bg-black/40 px-4 backdrop-blur-xl lg:px-8">
                <div className="flex items-center gap-3 overflow-hidden lg:gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-teal-500 lg:hidden"
                    onClick={() => setIsSidebarOpen(true)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-neutral-900/50 shadow-inner sm:flex">
                    <Terminal className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="overflow-hidden">
                    <h1 className="truncate text-xs font-black tracking-tight text-white uppercase sm:text-sm">
                      {selectedDevice.name}
                    </h1>
                    <div className="mt-0.5 flex items-center gap-2 overflow-hidden">
                      <span className="truncate font-mono text-[9px] text-neutral-500 sm:text-[10px]">
                        {selectedDevice.user}
                      </span>
                      <div className="h-0.5 w-0.5 shrink-0 rounded-full bg-neutral-700" />
                      <span className="line-clamp-1 truncate font-mono text-[9px] text-neutral-500 sm:text-[10px]">
                        {selectedDevice.platform}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleScreenshot}
                    className="h-8 border-white/5 bg-white/5 px-2 text-[9px] font-black tracking-widest uppercase transition-all hover:border-teal-500/30 hover:bg-white/10 active:scale-95 sm:h-9 sm:px-3 sm:text-[11px]"
                  >
                    <ImageIcon className="h-3 w-3 text-teal-400 sm:mr-2 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">Capture</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDevice(null)}
                    className="h-8 text-[9px] font-bold tracking-widest text-neutral-500 uppercase hover:text-red-400 sm:h-9 sm:text-[11px]"
                  >
                    <span className="hidden sm:inline">Disconnect</span>
                    <X className="h-4 w-4 sm:hidden" />
                  </Button>
                </div>
              </header>

              <FileExplorer
                currentPath={currentPath}
                files={files}
                disks={disks}
                isLoadingFiles={isLoadingFiles}
                fileSearch={fileSearch}
                setFileSearch={setFileSearch}
                fetchDirectory={fetchDirectory}
                handleUploadFile={handleUploadFile}
                handleDownloadFile={handleDownloadFile}
                isUploading={isUploading}
              />
            </>
          ) : (
            <div className="relative flex flex-1 flex-col items-center justify-center space-y-8 overflow-hidden p-6">
              <Button
                variant="outline"
                className="absolute top-6 left-6 border-white/5 bg-white/5 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="mr-2 h-4 w-4" />
                Select Node
              </Button>

              <div className="absolute h-64 w-64 rounded-full bg-teal-500/5 blur-[120px]" />
              <div className="absolute h-96 w-96 animate-pulse rounded-full bg-teal-400/2 blur-[150px]" />

              <div className="relative">
                <Monitor className="h-24 w-24 text-teal-500/20" />
                <div className="absolute inset-0 bottom-4 flex items-center justify-center">
                  <RefreshCw className="animate-spin-slow h-8 w-8 text-teal-500/40" />
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h3 className="text-xs font-black tracking-[0.4em] text-neutral-600 uppercase">
                  Awaiting Uplink
                </h3>
                <p className="font-mono text-[11px] tracking-wider text-neutral-700 uppercase">
                  Select a node from the Ghost Network to begin synchronization
                </p>
              </div>

              <div className="flex gap-4 opacity-20 transition-opacity hover:opacity-100">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 w-8 rounded-full bg-neutral-800"
                  />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <CaptureModal
        isOpen={isScreenshotOpen}
        onOpenChange={setIsScreenshotOpen}
        screenshot={screenshot}
      />

      <DeviceInfoDialog
        isOpen={isInfoOpen}
        onOpenChange={setIsInfoOpen}
        device={selectedInfoDevice}
      />
    </div>
  );
}
