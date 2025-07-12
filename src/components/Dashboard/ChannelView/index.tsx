// src/components/Dashboard/ChannelView/index.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Pastikan komponen ini ada
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Loader2, FileJson, Plus } from "lucide-react";
import type {
  ApiDbCategoryChannel,
  ApiDbSendMessageRequest,
  ApiDbProcessedMessage,
  ApiDbCreateChannelRequest,
} from "@/types";

interface ChannelViewProps {
  channels: ApiDbCategoryChannel[];
  activeCategoryId: string | null;
  onChannelCreated: () => void;
  onChannelDeleted: () => void;
  onDataChanged: () => void; // Callback baru untuk refresh setelah data berubah
}

export function ChannelView({
  channels,
  activeCategoryId,
  onChannelCreated,
  onChannelDeleted,
  onDataChanged,
}: ChannelViewProps) {
  // State untuk dialog "Add Record" (membuat channel baru)
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // State untuk dialog "Add Data" (membuat message baru)
  const [addDataOpen, setAddDataOpen] = useState(false);
  const [isCreatingData, setIsCreatingData] = useState(false);
  const [newDataName, setNewDataName] = useState("");
  const [newDataContent, setNewDataContent] = useState("");
  const [targetChannelId, setTargetChannelId] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // State untuk menghapus
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // --- Handlers untuk Channel (Record) ---
  const handleCreateChannel = async () => {
    if (!newChannelName || !activeCategoryId) return;
    setIsCreatingChannel(true);
    await fetch(`/api/database/${activeCategoryId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { name: newChannelName },
      } as ApiDbCreateChannelRequest),
    });
    setIsCreatingChannel(false);
    setNewChannelName("");
    setAddRecordOpen(false);
    onChannelCreated();
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!activeCategoryId) return;
    setIsDeleting(channelId);
    await fetch(`/api/database/${activeCategoryId}/${channelId}`, {
      method: "DELETE",
    });
    setIsDeleting(null);
    onChannelDeleted();
  };

  // --- Handlers untuk Message (Data) ---
  const openAddDataDialog = (channelId: string) => {
    setTargetChannelId(channelId);
    setNewDataName("");
    setNewDataContent("{\n  \n}"); // Default content
    setJsonError(null);
    setAddDataOpen(true);
  };

  const handleCreateData = async () => {
    if (
      !newDataName ||
      !newDataContent ||
      !targetChannelId ||
      !activeCategoryId
    )
      return;

    let parsedContent;
    try {
      parsedContent = JSON.parse(newDataContent);
      setJsonError(null);
    } catch (e) {
      setJsonError("Invalid JSON format.");
      return;
    }

    setIsCreatingData(true);
    const payload: ApiDbSendMessageRequest = {
      data: {
        name: newDataName,
        content: JSON.stringify(parsedContent),
      },
    };

    await fetch(`/api/database/${activeCategoryId}/${targetChannelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsCreatingData(false);
    setAddDataOpen(false);
    onDataChanged(); // Refresh data untuk menampilkan entri baru
  };

  if (!activeCategoryId) {
    return (
      <div className="text-off-white/50 flex flex-1 items-center justify-center p-6">
        <p>Select a table from the left to view its records.</p>
      </div>
    );
  }

  return (
    <>
      <main className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-off-white text-2xl font-bold">Data Records</h2>
          <Dialog open={addRecordOpen} onOpenChange={setAddRecordOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80">
                <PlusCircle size={20} className="mr-2" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Record</DialogTitle>
                <DialogDescription className="text-off-white/70">
                  This will create a new data record (channel) in the selected
                  table.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="channel-name">Record Name</Label>
                <Input
                  id="channel-name"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  className="bg-dark-shale border-teal-muted/50"
                  placeholder="e.g., user-profiles"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateChannel}
                  disabled={isCreatingChannel}
                  className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
                >
                  {isCreatingChannel && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {channels.map((ch) => (
            <Card
              key={ch.id}
              className="bg-gunmetal/50 border-gunmetal text-off-white flex flex-col"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                  <FileJson size={16} />
                  {ch.name}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteChannel(ch.id)}
                  disabled={!!isDeleting}
                  className="h-8 w-8 text-red-500/50 hover:bg-red-900/30 hover:text-red-500"
                >
                  {isDeleting === ch.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </Button>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="mb-4">
                  <h4 className="text-off-white/60 mb-2 text-xs font-semibold uppercase">
                    Data Entries ({ch.messages.length})
                  </h4>
                  {ch.messages.length > 0 ? (
                    <ul className="max-h-24 space-y-1 overflow-y-auto pr-2 text-xs">
                      {ch.messages.map((msg: ApiDbProcessedMessage) => (
                        <li
                          key={msg.id}
                          className="bg-dark-shale/50 flex items-center justify-between rounded p-1.5"
                        >
                          <span className="truncate" title={msg.name}>
                            {msg.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-off-white/50 py-4 text-center text-xs">
                      No data entries yet.
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-teal-muted/20 text-dark-sha hover:bg-teal-muted/10 w-full"
                  onClick={() => openAddDataDialog(ch.id)}
                >
                  <Plus size={16} className="mr-2" />
                  Add Data Entry
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* DIALOG FOR ADDING DATA (MESSAGE) */}
      <Dialog open={addDataOpen} onOpenChange={setAddDataOpen}>
        <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Data Entry</DialogTitle>
            <DialogDescription className="text-off-white/70">
              Provide a name and the JSON content for the new data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="data-name">Entry Name</Label>
              <Input
                id="data-name"
                value={newDataName}
                onChange={(e) => setNewDataName(e.target.value)}
                className="bg-dark-shale border-teal-muted/50"
                placeholder="e.g., user_profile_01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data-content">Content (JSON)</Label>
              <Textarea
                id="data-content"
                value={newDataContent}
                onChange={(e: any) => setNewDataContent(e.target.value)}
                className="bg-dark-shale border-teal-muted/50 min-h-[150px] font-mono"
                placeholder='{ "key": "value", "id": 123 }'
              />
              {jsonError && <p className="text-sm text-red-500">{jsonError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateData}
              disabled={isCreatingData}
              className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
            >
              {isCreatingData && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
