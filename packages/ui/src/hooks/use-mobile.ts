import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(listener: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", listener);
  return () => mql.removeEventListener("change", listener);
}

/**
 * A media query is an external store, so read it as one. The upstream shadcn
 * version syncs it into state inside an effect, which costs an extra render
 * and renders one frame at the wrong breakpoint; this returns the right
 * answer on the first client render instead.
 *
 * The server snapshot is `false` — SSR has no viewport, and the desktop
 * sidebar is the sane default to hydrate into.
 */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
