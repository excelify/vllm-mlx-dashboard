"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GpuMetrics } from "@/types";
import { formatNumber } from "./metric-value";
import { CollapseChevron } from "./view-switch";
import { useSectionOpen } from "@/lib/view-prefs";

interface AggregatedStats {
  onlineCount: number;
  totalCount: number;
  totalThroughput: number;
  totalTokens: number;
  /** Encoding tokens computed (prefill) and served from the prefix cache. */
  totalPromptTokens: number;
  totalCachedTokens: number;
  activeRequests: number;
  deferredRequests: number;
}

interface GlobalStatsProps {
  stats: AggregatedStats | null;
  gpu: GpuMetrics | undefined;
  defaultOpen?: boolean;
}

export function GlobalStats({ stats, gpu, defaultOpen = true }: GlobalStatsProps) {
  const { open, toggle } = useSectionOpen("global-stats", defaultOpen);
  if (!stats) return null;

  const onlineColor =
    stats.onlineCount === stats.totalCount
      ? "text-emerald-400"
      : stats.onlineCount === 0
        ? "text-red-400"
        : "text-amber-400";

  const encTotal = stats.totalPromptTokens + stats.totalCachedTokens;
  const cachePct = encTotal > 0 ? (stats.totalCachedTokens / encTotal) * 100 : 0;

  return (
    <Card className={open ? undefined : "gap-0 py-3"}>
      <CardContent className="py-4">
        {/* Serving/studio headline. Collapsing it leaves the numbers that matter
            at a glance on one line, so the totals never have to disappear. */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {/* Expanded, the stat blocks below already say "Servers Online", so
                the header only carries the headline while collapsed. */}
            {!open && (
              <>
                <span className="text-xs text-muted-foreground">Servers Online</span>
                <span className={`text-lg font-bold font-mono tabular-nums ${onlineColor}`}>
                  {stats.onlineCount}/{stats.totalCount}
                </span>
                <span className="flex flex-wrap items-baseline gap-x-3 text-xs">
                <span className="font-mono tabular-nums">{stats.totalThroughput.toFixed(1)} tok/s</span>
                <span className="font-mono tabular-nums text-muted-foreground">{formatNumber(stats.totalTokens)} tokens</span>
                <span className="font-mono tabular-nums text-muted-foreground">{stats.activeRequests} active</span>
                {stats.deferredRequests > 0 && (
                  <span className="font-mono tabular-nums text-red-400">{stats.deferredRequests} deferred</span>
                )}
                </span>
              </>
            )}
          </div>
          <CollapseChevron open={open} onToggle={toggle} label="Servers Online totals" />
        </div>

        {open && (
        <div className="mt-3 flex flex-wrap gap-6 items-end">
          <StatBlock label="Servers Online">
            <span className={`text-2xl font-bold font-mono tabular-nums ${onlineColor}`}>
              {stats.onlineCount}/{stats.totalCount}
            </span>
          </StatBlock>

          <StatBlock label="Total Throughput">
            <span className="text-2xl font-bold font-mono tabular-nums">
              {stats.totalThroughput.toFixed(1)}
              <span className="text-sm text-muted-foreground ml-1">tok/s</span>
            </span>
          </StatBlock>

          <StatBlock label="Tokens Generated">
            <span className="text-lg font-bold font-mono tabular-nums">
              {formatNumber(stats.totalTokens)}
            </span>
          </StatBlock>

          {/* Encoding (prompt) tokens since each engine started: total input,
              the part matched in the prefix cache (free) and the part the GPU
              had to compute — the computed part is what costs time. */}
          <StatBlock label="Encoding tokens · total">
            <span className="text-lg font-bold font-mono tabular-nums">
              {formatNumber(encTotal)}
            </span>
          </StatBlock>

          <StatBlock label={`cache match · ${cachePct.toFixed(0)} %`}>
            <span className="text-lg font-bold font-mono tabular-nums text-emerald-400">
              {formatNumber(stats.totalCachedTokens)}
            </span>
          </StatBlock>

          <StatBlock label="computed (prefill)">
            <span className="text-lg font-bold font-mono tabular-nums">
              {formatNumber(stats.totalPromptTokens)}
            </span>
          </StatBlock>

          <StatBlock label="Active Requests">
            <span className="text-lg font-bold font-mono tabular-nums">
              {stats.activeRequests}
            </span>
          </StatBlock>

          <StatBlock label="Deferred Requests">
            <span
              className={`text-lg font-bold font-mono tabular-nums ${
                stats.deferredRequests > 0 ? "text-red-400" : ""
              }`}
            >
              {stats.deferredRequests}
            </span>
          </StatBlock>

          <StatBlock label="GPU">
            <div className="flex items-center gap-2">
              <div className="w-20">
                <Progress value={gpu?.gpu_utilization_percent ?? 0} className="h-2" />
              </div>
              <span className="text-xs font-mono tabular-nums text-muted-foreground">
                {gpu?.gpu_utilization_percent != null
                  ? `${gpu.gpu_utilization_percent.toFixed(0)}%`
                  : "N/A"}
                {gpu?.gpu_power_watts != null && ` / ${gpu.gpu_power_watts.toFixed(0)}W`}
              </span>
            </div>
          </StatBlock>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
