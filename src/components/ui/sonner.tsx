// src/components/ui/sonner.tsx
"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-neutral-950/90 group-[.toaster]:text-neutral-50 group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:backdrop-blur-xl group-[.toaster]:rounded-xl group-[.toaster]:font-mono group-[.toaster]:tracking-tight",
          description: "group-[.toast]:text-neutral-400 font-sans",
          actionButton:
            "group-[.toast]:bg-teal-500 group-[.toast]:text-black font-bold",
          cancelButton:
            "group-[.toast]:bg-neutral-800 group-[.toast]:text-neutral-400",
          error:
            "group-[.toaster]:!border-red-500/30 group-[.toaster]:!bg-red-950/20",
          success:
            "group-[.toaster]:!border-teal-500/30 group-[.toaster]:!bg-teal-950/20",
          warning:
            "group-[.toaster]:!border-amber-500/30 group-[.toaster]:!bg-amber-950/20",
          info: "group-[.toaster]:!border-blue-500/30 group-[.toaster]:!bg-blue-950/20",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
