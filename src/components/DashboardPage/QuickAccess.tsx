// src/components/DashboardPage/QuickAccess.tsx
"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  Camera,
  FileInput,
  GraduationCap,
  FileDown,
} from "lucide-react";

const tools = [
  {
    href: "/kuliah/tools/photo-formatter",
    label: "Photo Formatter",
    icon: Camera,
  },
  {
    href: "/kuliah/tools/docx-extractor",
    label: "Docx Extractor",
    icon: FileDown,
  },
  {
    href: "/kuliah/tools/checklist-teksip",
    label: "Checklist Teksip",
    icon: FileInput,
  },
  {
    href: "/kuliah/tools/sipadu-leaked",
    label: "Sipadu Viewer",
    icon: GraduationCap,
  },
];

export const QuickAccess = () => {
  return (
    <Card className="border-border/50 bg-card/50 h-full backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-teal-500" /> Quick Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="w-full">
            <Button
              variant="outline"
              className="h-auto w-full flex-col gap-2 py-4 hover:border-teal-500/50 hover:bg-teal-500/5 hover:text-teal-600 dark:hover:text-teal-400"
            >
              <div className="bg-muted text-foreground/70 rounded-full p-2">
                {<tool.icon className="h-5 w-5" />}
              </div>
              <span className="text-xs font-medium">{tool.label}</span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
