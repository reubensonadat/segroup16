import React from "react";
import { cn } from "../../../utils/cn";

interface MarkerLabelProps {
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom";
}

const positionClasses = {
  top: "bottom-full mb-1.5",
  bottom: "top-full mt-1.5",
} as const;

export function MarkerLabel({ children, className, position = "top" }: MarkerLabelProps) {
  return (
    <div
      className={cn(
        "absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-card/95 text-foreground shadow-sm border border-black/5 dark:border-white/10 dark:bg-stone-200 dark:text-black",
        positionClasses[position],
        className
      )}
    >
      {children}
    </div>
  );
}
