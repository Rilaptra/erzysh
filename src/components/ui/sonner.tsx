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
            "group toast group-[.toaster]:bg-gunmetal group-[.toaster]:text-off-white group-[.toaster]:border-teal-muted/20 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-off-white/80",
          actionButton:
            "group-[.toast]:bg-teal-muted group-[.toast]:text-dark-shale",
          cancelButton:
            "group-[.toast]:bg-gunmetal group-[.toast]:text-off-white/80",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
