import type { Transition, Variants } from "framer-motion";

import { getMotionPreset, type MotionPresetId } from "./presets";

/** What the components need: a transition plus whether to animate at all. */
export type MotionConfig = {
  enabled: boolean;
  transition: Transition;
  /** Folder body expanding/collapsing. */
  collapse: Variants;
  /** A tree row entering or leaving because search filtered the list. */
  row: Variants;
  /** Hover lift — only the springy preset earns one. */
  rowHover: { y: number; scale: number } | undefined;
};

const INSTANT: Transition = { duration: 0 };

export function buildMotionConfig(
  presetId: MotionPresetId,
  reducedMotion: boolean,
): MotionConfig {
  const preset = getMotionPreset(presetId);
  const enabled = !reducedMotion && preset.transition !== null;
  const transition = enabled ? preset.transition! : INSTANT;

  return {
    enabled,
    transition,
    collapse: {
      closed: { height: 0, opacity: 0 },
      open: { height: "auto", opacity: 1 },
    },
    row: {
      hidden: { opacity: 0, x: enabled ? -6 : 0 },
      visible: { opacity: 1, x: 0 },
    },
    rowHover:
      enabled && presetId === "springy" ? { y: -1, scale: 1.01 } : undefined,
  };
}
