"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * View preferences for the monitor page.
 *
 * The page shows a lot of live data at once: global stats, live requests, two
 * history charts and one card per machine. Three persisted view modes let the
 * operator drop to a single screen without losing the detail that is still
 * wanted occasionally. Everything is stored per browser in localStorage —
 * no server state, no API change.
 *
 * localStorage is an external store, so it is read through
 * useSyncExternalStore: the server snapshot is the default, the client
 * snapshot is what the operator last chose, and there is no setState-in-effect
 * and no hydration mismatch.
 */

export type ViewMode = "compact" | "standard" | "full";

export const VIEW_MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: "compact", label: "Compact", hint: "Machines and totals only" },
  { id: "standard", label: "Standard", hint: "Live requests, machines; history collapsed" },
  { id: "full", label: "Full", hint: "Everything open, all charts" },
];

const MODE_KEY = "dashboard.viewMode.v1";
/** Per-section OPEN flags: true = expanded. */
const OPEN_KEY = "dashboard.open.v1";

interface Prefs {
  mode: ViewMode;
  /** true = the section body is expanded. */
  open: Record<string, boolean>;
}

const SERVER_SNAPSHOT: Prefs = { mode: "standard", open: {} };

let cached: Prefs | null = null;
let cachedKey = "";
const listeners = new Set<() => void>();

function isMode(value: unknown): value is ViewMode {
  return value === "compact" || value === "standard" || value === "full";
}

function parseOpen(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>;
    }
  } catch {
    /* corrupt entry — start clean */
  }
  return {};
}

/**
 * getSnapshot must return a referentially stable value while storage has not
 * changed, so the raw strings double as the cache key.
 */
function getSnapshot(): Prefs {
  let modeRaw: string | null = null;
  let openRaw: string | null = null;
  try {
    modeRaw = localStorage.getItem(MODE_KEY);
    openRaw = localStorage.getItem(OPEN_KEY);
  } catch {
    /* storage disabled (private mode): defaults only, nothing persists */
    return SERVER_SNAPSHOT;
  }

  const key = `${modeRaw ?? ""}|${openRaw ?? ""}`;
  if (!cached || key !== cachedKey) {
    cachedKey = key;
    cached = {
      mode: isMode(modeRaw) ? modeRaw : "standard",
      open: parseOpen(openRaw),
    };
  }
  return cached;
}

function getServerSnapshot(): Prefs {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab editing the same key should update this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === MODE_KEY || event.key === OPEN_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or disabled: the choice just will not persist */
  }
  emit();
}

/** Page-level mode: which sections exist at all. */
export function useViewMode() {
  const { mode } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setMode = useCallback((next: ViewMode) => {
    write(MODE_KEY, next);
  }, []);

  return { mode, setMode };
}

/**
 * Per-section open state, remembered by id. `defaultOpen` is the view mode's
 * default, so a card follows the mode until the operator overrides it.
 */
export function useSectionOpen(id: string, defaultOpen: boolean) {
  const { open: flags } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const open = flags[id] ?? defaultOpen;

  const toggle = useCallback(() => {
    const current = getSnapshot().open[id] ?? defaultOpen;
    write(OPEN_KEY, JSON.stringify({ ...getSnapshot().open, [id]: !current }));
  }, [defaultOpen, id]);

  return { open, toggle };
}
