// src/components/Dashboard/Sidebar/index.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
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
import {
  Plus,
  Trash2,
  Loader2,
  Database,
  Edit2,
  Check,
  FolderOpen,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { DiscordCategory } from "@/types";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/lib/actions";

interface CategorySidebarProps {
  categories: DiscordCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void; // Callback to refresh data in parent
}

export function CategorySidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  isOpen,
  onDataChanged,
}: CategorySidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (!newCategoryName) return;
    setIsCreating(true);
    try {
      await createCategoryAction(newCategoryName);
      toast.success("Container created!");
      setNewCategoryName("");
      setDialogOpen(false);
      onDataChanged?.(); // Trigger parent to refresh data
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName) return;
    setIsProcessing(true);
    try {
      await updateCategoryAction(id, editingName);
      setEditingId(null);
      toast.success("Renamed!");
      onDataChanged?.(); // Trigger parent to refresh data
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this container and ALL its data?")) return;
    setIsProcessing(true);
    try {
      await deleteCategoryAction(id);
      toast.success("Deleted!");
      onDataChanged?.(); // Trigger parent to refresh data
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <aside
      className={cn(
        "border-border/40 bg-background/50 fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="border-border/40 flex h-16 items-center border-b px-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Database className="text-teal-500" /> Containers
        </h2>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-4">
        {categories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          const isEditing = editingId === cat.id;

          return (
            <div
              key={cat.id}
              className={cn(
                "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "border border-teal-500/20 bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
              onClick={() => !isEditing && onSelectCategory(cat.id)}
            >
              {isEditing ? (
                <div className="flex w-full gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdate(cat.id);
                    }}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 truncate">
                    {isActive ? (
                      <FolderOpen className="h-4 w-4" />
                    ) : (
                      <Folder className="h-4 w-4" />
                    )}
                    <span className="truncate">{cat.name}</span>
                  </div>

                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(cat.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-border/40 bg-background/50 border-t p-4 backdrop-blur-md">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2 bg-teal-600 text-white hover:bg-teal-700">
              <Plus className="h-4 w-4" /> New Container
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Container</DialogTitle>
              <DialogDescription>
                Containers hold your data boxes.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Name</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Project Alpha"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={isCreating}>
                {isCreating ? <Loader2 className="animate-spin" /> : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </aside>
  );
}
