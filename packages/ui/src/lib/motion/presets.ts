import type { Transition } from "framer-motion";

export type MotionPresetId = "none" | "subtle" | "smooth" | "springy";

export type MotionPreset = {
  id: MotionPresetId;
  label: string;
  description: string;
  /** `null` = animate nothing; components take the instant path. */
  transition: Transition | null;
};

/**
 * One id drives two layers: this table (Framer transitions) and the
 * `--motion-*` custom properties in the consuming app's stylesheet, which the
 * sidebar's Tailwind classes read. `useMotionConfig` pins the id to `subtle`,
 * so only that row currently has a CSS counterpart — keep the two in step if
 * a preference UI ever selects another.
 */
export const MOTION_PRESETS: readonly MotionPreset[] = [
  {
    id: "none",
    label: "None",
    description: "Everything snaps. Also what reduced-motion forces.",
    transition: null,
  },
  {
    id: "subtle",
    label: "Subtle",
    description: "Short, flat easing. Gets out of the way.",
    transition: { type: "tween", duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  {
    id: "smooth",
    label: "Smooth",
    description: "Longer glide on an expo curve.",
    transition: { type: "tween", duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  {
    id: "springy",
    label: "Springy",
    description: "Real spring physics, with a little overshoot.",
    transition: { type: "spring", stiffness: 400, damping: 24, mass: 0.7 },
  },
];

export const MOTION_PRESET_IDS = MOTION_PRESETS.map((p) => p.id);

export function isMotionPresetId(value: unknown): value is MotionPresetId {
  return (
    typeof value === "string" &&
    MOTION_PRESET_IDS.includes(value as MotionPresetId)
  );
}

export function getMotionPreset(id: MotionPresetId): MotionPreset {
  return MOTION_PRESETS.find((p) => p.id === id) ?? MOTION_PRESETS[1]!;
}
