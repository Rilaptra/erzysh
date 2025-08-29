// src/components/DashboardPage/QuickAccess.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wrench,
  Camera,
  ListChecks,
  GraduationCap,
  FileInput,
} from "lucide-react"; // Tambahkan FileInput
import Link from "next/link";

const tools = [
  {
    href: "/kuliah/tools/photo-formatter",
    label: "Photo to DOCX",
    icon: <Camera className="size-5" />,
  },
  // --- TAMBAHKAN TOOL BARU DI SINI ---
  {
    href: "/kuliah/tools/docx-extractor",
    label: "DOCX to Photo",
    icon: <FileInput className="size-5" />,
  },
  {
    href: "/kuliah/tools/checklist-teksip",
    label: "Checklist Teksip",
    icon: <ListChecks className="size-5" />,
  },
  {
    href: "/kuliah/tools/sipadu-leaked",
    label: "Sipadu Leaked",
    icon: <GraduationCap className="size-5" />,
  },
];

export const QuickAccess = () => {
  return (
    <Card className="bg-gunmetal/30 border-gunmetal/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-off-white flex items-center gap-2">
          <Wrench className="text-teal-muted" />
          Quick Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tools.map((tool) => (
          <Link className="w-full" href={tool.href} key={tool.href}>
            <Button
              variant="outline"
              className="border-gunmetal/80 hover:bg-gunmetal/80 w-full justify-start"
            >
              <span className="text-teal-muted mr-3">{tool.icon}</span>
              {tool.label}
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
};
