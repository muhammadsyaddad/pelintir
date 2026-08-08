"use client";

import { useMemo } from "react";

import { buildMotionConfig, type MotionConfig } from "../lib/motion/variants";
import type { MotionPresetId } from "../lib/motion/presets";
import { usePrefersReducedMotion } from "./use-reduced-motion";

/**
 * Fixed, because there is no preference UI to change it. The matching CSS
 * duration/easing tokens are the unprefixed `:root` block in the consuming
 * app's stylesheet — keep the two in step if this ever moves.
 */
const PRESET: MotionPresetId = "subtle";

/**
 * The single funnel every animated component reads. Folding the OS setting
 * in here means there is exactly one place that can get reduced-motion wrong.
 */
export function useMotionConfig(): MotionConfig {
  const reduced = usePrefersReducedMotion();
  return useMemo(() => buildMotionConfig(PRESET, reduced), [reduced]);
}
