"use client";

import { ChevronRight } from "lucide-react";
import { VIEW_MODES, type ViewMode } from "@/lib/view-prefs";
import { cn } from "@/lib/utils";

/** Compact / Standard / Full segmented control for the monitor page. */
export function ViewSwitch({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">View</span>
      <div className="flex rounded-md bg-muted p-0.5" role="group" aria-label="Dashboard view mode">
        {VIEW_MODES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            aria-pressed={mode === v.id}
            title={v.hint}
            className={cn(
              "rounded px-2.5 py-0.5 text-xs transition-colors",
              mode === v.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Chevron that folds a card's body away. Lives in the card header. */
export function CollapseChevron({
  open,
  onToggle,
  label = "Toggle section",
}: {
  open: boolean;
  onToggle: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={label}
      title={open ? "Minimize" : "Expand"}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
    </button>
  );
}
