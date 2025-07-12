// src/components/Dashboard/Sidebar/index.tsx
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
import { PlusCircle, Trash2, Loader2, Database } from "lucide-react";
import type { ApiDbCreateCategoryRequest, DiscordCategory } from "@/types";

interface CategorySidebarProps {
  categories: DiscordCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string) => void;
  onCategoryCreated: () => void;
  onCategoryDeleted: () => void;
}

export function CategorySidebar({
  categories,
  activeCategoryId,
  onSelectCategory,
  onCategoryCreated,
  onCategoryDeleted,
}: CategorySidebarProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName) return;
    setIsCreating(true);
    // Endpoint: POST /api/database
    await fetch("/api/database", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Body sesuai API docs, tanpa wrapper 'data'
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
    // Endpoint: DELETE /api/database/{id}
    await fetch(`/api/database/${id}`, { method: "DELETE" });
    setIsDeleting(null);
    onCategoryDeleted();
  };

  return (
    <aside className="border-gunmetal/50 bg-dark-shale/20 z-10 flex w-full flex-col space-y-4 border-r p-4 backdrop-blur-sm md:w-64">
      <div className="flex items-center justify-between">
        <h2 className="text-off-white flex items-center gap-2 text-lg font-bold">
          <Database size={20} /> Tables
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
              <DialogTitle>Create New Table</DialogTitle>
              <DialogDescription className="text-off-white/70">
                This will create a new category on your Discord server.
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
                Create Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <nav className="flex flex-col space-y-1">
        {categories.map((cat) => (
          <div key={cat.id} className="group flex items-center">
            <Button
              variant="ghost"
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full justify-start ${activeCategoryId === cat.id ? "bg-gunmetal text-teal-muted" : "text-off-white/80 hover:bg-gunmetal/50"}`}
            >
              {cat.name}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteCategory(cat.id)}
              disabled={!!isDeleting}
              className="text-red-500/50 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-900/30 hover:text-red-500"
            >
              {isDeleting === cat.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </Button>
          </div>
        ))}
      </nav>
    </aside>
  );
}
