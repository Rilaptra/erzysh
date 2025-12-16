"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Ghost, Download, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function GhostBridge() {
  const [filePath, setFilePath] = useState("");
  const [status, setStatus] = useState<"idle" | "waiting" | "ready">("idle");
  const [downloadLink, setDownloadLink] = useState("");

  // Polling buat cek apakah PC udah balas
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === "waiting") {
      interval = setInterval(async () => {
        try {
          const res = await fetch("/api/ghost");
          const data = await res.json();

          if (data.result) {
            setDownloadLink(data.result);
            setStatus("ready");
            toast.success("File siap didownload!");
            clearInterval(interval);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 3000); // Cek tiap 3 detik
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleRequest = async () => {
    if (!filePath) return toast.error("Masukkan path file dulu!");

    setStatus("waiting");
    setDownloadLink("");

    try {
      await fetch("/api/ghost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "queue_command",
          command: `GET_FILE:${filePath}`, // Command standard kita
        }),
      });
      toast.info("Perintah dikirim ke PC. Menunggu respon...");
    } catch (e) {
      toast.error("Gagal mengirim perintah.");
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-4">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-950 text-neutral-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-500">
            <Ghost className="h-6 w-6" /> Ghost Bridge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-neutral-400">File Path (PC)</label>
            <Input
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="D:\Kuliah\Tugas_Besar.zip"
              className="border-neutral-800 bg-neutral-900 font-mono text-sm"
            />
          </div>

          {status === "idle" && (
            <Button
              onClick={handleRequest}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Send className="mr-2 h-4 w-4" /> Request File
            </Button>
          )}

          {status === "waiting" && (
            <Button disabled className="w-full bg-neutral-800 text-neutral-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menunggu PC
              Upload...
            </Button>
          )}

          {status === "ready" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-3">
              <div className="rounded-lg border border-green-900 bg-green-900/20 p-3 text-center">
                <p className="mb-2 text-sm text-green-400">File Ready!</p>
                <a href={downloadLink} target="_blank" rel="noreferrer">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="mr-2 h-4 w-4" /> Download Sekarang
                  </Button>
                </a>
              </div>
              <Button
                variant="ghost"
                onClick={() => setStatus("idle")}
                className="w-full text-xs"
              >
                Request File Lain
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
