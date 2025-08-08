// src/app/dashboard/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
      <div className="space-x-4">
        <Link href="/database">
          <Button>Database</Button>
        </Link>
        <Link href="/kuliah">
          <Button>Kuliah</Button>
        </Link>
      </div>
    </div>
  );
}
