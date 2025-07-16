// src/components/Dashboard/Sidebar/index.tsx
"use client";
import { useState, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button"; // Impor buttonVariants
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
  PlusCircle,
  Trash2,
  Loader2,
  Database,
  Edit,
  Check,
} from "lucide-react";
import type { ApiDbCreateCategoryRequest, DiscordCategory } from "@/types";
import { cn } from "@/lib/cn"; // Impor cn

interface CategorySidebarProps {
  categories: DiscordCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onCategoryCreated: () => void;
  onCategoryDeleted: () => void;
  onCategoryUpdated: () => void;
}

export function CategorySidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onCategoryCreated,
  onCategoryDeleted,
  onCategoryUpdated,
}: CategorySidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreateCategory = async () => {
    if (!newCategoryName) return;
    setIsCreating(true);
    await fetch("/api/database", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: { name: newCategoryName },
      } as ApiDbCreateCategoryRequest),
    });
    setIsCreating(false);
    setNewCategoryName("");
    setOpen(false);
    onCategoryCreated();
  };

  const handleDeleteCategory = async (id: string) => {
    setIsDeleting(id);
    await fetch(`/api/database/${id}`, { method: "DELETE" });
    setIsDeleting(null);
    onCategoryDeleted();
  };

  const handleStartEdit = (cat: DiscordCategory) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleUpdateCategoryName = async (id: string) => {
    if (!editingCategoryName || isUpdating) return;
    setIsUpdating(true);
    await fetch(`/api/database/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingCategoryName }),
    });
    setIsUpdating(false);
    setEditingCategoryId(null);
    setEditingCategoryName("");
    onCategoryUpdated();
  };

  return (
    <aside className="border-gunmetal/50 bg-dark-shale/20 z-10 flex w-48 flex-col space-y-4 border-r p-4 backdrop-blur-sm md:w-64">
      <div className="flex items-center justify-between">
        <h2 className="text-off-white flex items-center gap-2 text-lg font-bold">
          <Database size={20} /> Containers
        </h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-teal-muted hover:bg-gunmetal hover:text-teal-muted/80"
            >
              <PlusCircle size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gunmetal border-teal-muted/30 text-off-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Container</DialogTitle>
              <DialogDescription className="text-off-white/70">
                This will create a new container (category) on your Discord
                server.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="bg-dark-shale border-teal-muted/50 col-span-3"
                  placeholder="e.g., project-documents"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCategory}
                disabled={isCreating}
                className="bg-teal-muted text-dark-shale hover:bg-teal-muted/80"
              >
                {isCreating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Container
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <nav className="flex flex-col space-y-1">
        {categories.map((cat) => (
          <div key={cat.id} className="w-full">
            {editingCategoryId === cat.id ? (
              <div className="flex w-full items-center gap-1">
                <Input
                  ref={inputRef}
                  value={editingCategoryName}
                  onChange={(e) => setEditingCategoryName(e.target.value)}
                  onBlur={() => handleUpdateCategoryName(cat.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateCategoryName(cat.id);
                  }}
                  className="bg-dark-shale border-teal-muted/50 h-9 flex-1 px-2"
                  disabled={isUpdating}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleUpdateCategoryName(cat.id)}
                  disabled={isUpdating}
                  className="h-9 w-9"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                </Button>
              </div>
            ) : (
              <div
                onClick={() => onSelectCategory(cat.id)}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "group relative w-full cursor-pointer justify-start text-left",
                  {
                    "bg-gunmetal text-teal-muted": activeCategoryId === cat.id,
                    "text-off-white/80 hover:bg-gunmetal/50":
                      activeCategoryId !== cat.id,
                  },
                )}
              >
                <span className="truncate pr-16">{cat.name}</span>
                <div className="absolute top-1/2 right-1 flex -translate-y-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(cat);
                    }}
                    className="text-off-white/50 hover:text-off-white h-8 w-8 hover:bg-transparent"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategory(cat.id);
                    }}
                    disabled={!!isDeleting && isDeleting === cat.id}
                    className="h-8 w-8 text-red-500/50 hover:bg-transparent hover:text-red-500"
                  >
                    {isDeleting === cat.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
