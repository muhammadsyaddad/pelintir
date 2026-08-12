"use client";

import * as React from "react";
import { MotionConfig } from "framer-motion";

import { TooltipProvider } from "../ui/tooltip";
import { TreeAdapterProvider } from "./tree-provider";

export function SidebarProviders({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <TreeAdapterProvider>{children}</TreeAdapterProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
