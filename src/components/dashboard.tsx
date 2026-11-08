"use client";

import { useMemo } from "react";
import { useServersData, useGpuData } from "@/hooks/use-dashboard-data";
import { useTimeSeries } from "@/hooks/use-time-series";
import { useRealtimeThroughput } from "@/hooks/use-realtime-throughput";
import { GlobalStats } from "./global-stats";
import { ServerCard } from "./server-card";
import { SplashCard } from "./splash-card";
import { OmlxCard } from "./omlx-card";
import { SystemCard } from "./system-card";
import { LoadHistory } from "./load-history";
import { ThermalHistory } from "./thermal-history";
import { LiveRequests } from "./live-requests";
import { ViewSwitch } from "./view-switch";
import { useViewMode, VIEW_MODES } from "@/lib/view-prefs";
import { counters } from "@/lib/counters";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { mode, setMode } = useViewMode();
  const { data: serversData, isLoading: serversLoading } = useServersData();
  const { data: gpuData } = useGpuData();
  const timeSeries = useTimeSeries(serversData, gpuData);
  const realtimeThroughput = useRealtimeThroughput(serversData);

  const aggregated = useMemo(() => {
    if (!serversData) return null;
    const online = serversData.servers.filter((s) => s.online);
    // One counter view per engine (lib/counters) — llama.cpp, vllm-mlx, oMLX
    // and Splash report the same things under different names.
    const c = online.map(counters).filter((x): x is NonNullable<typeof x> => x != null);
    return {
      onlineCount: online.length,
      totalCount: serversData.servers.length,
      totalThroughput: online.reduce(
        (sum, s) => sum + (realtimeThroughput[s.config.id]?.generation ?? 0),
        0
      ),
      totalTokens: c.reduce((sum, x) => sum + x.gen, 0),
      totalPromptTokens: c.reduce((sum, x) => sum + x.prompt, 0),
      totalCachedTokens: c.reduce((sum, x) => sum + x.cached, 0),
      activeRequests: c.reduce((sum, x) => sum + x.running, 0),
      deferredRequests: c.reduce((sum, x) => sum + x.waiting, 0),
    };
  }, [serversData, realtimeThroughput]);

  if (serversLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* View density: the page holds live requests, two history charts, one
          card per machine and the totals. Compact keeps the totals and the
          machines, Standard adds live requests and folds the history away,
          Full opens everything. The choice is remembered per browser. */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 flex flex-wrap items-center justify-between gap-2 border-b bg-background/95 px-6 py-2 backdrop-blur">
        <span className="text-xs text-muted-foreground">
          {VIEW_MODES.find((v) => v.id === mode)?.hint}
        </span>
        <ViewSwitch mode={mode} onChange={setMode} />
      </div>

      <GlobalStats stats={aggregated} gpu={gpuData?.gpu} defaultOpen />

      {mode !== "compact" && (
        <LiveRequests servers={serversData?.servers ?? []} timestamp={serversData?.timestamp} defaultOpen />
      )}

      {/* One history card for the whole server. The former live "GPU load" and
          "Throughput" cards showed the same series over the last few minutes
          only while the page was open — the 1h range here covers that. */}
      {mode !== "compact" && <LoadHistory defaultOpen={mode === "full"} />}

      {mode !== "compact" && <ThermalHistory defaultOpen={mode === "full"} />}

      {/* Compact puts the machine cards side by side (one column each, narrower
          gap); Standard and Full give each engine the width its charts need.
          In Compact the host card starts folded — the machine cards are the
          point of that view. */}
      <div className={mode === "compact"
        ? "grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3"
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>
        <SystemCard system={gpuData?.system} gpu={gpuData?.gpu} defaultOpen={mode !== "compact"} />
        {serversData?.servers.map((server) =>
          server.config.framework === "splash" ? (
            <SplashCard key={server.config.id} server={server} history={timeSeries} timestamp={serversData.timestamp} />
          ) : server.config.framework === "omlx" ? (
            <OmlxCard key={server.config.id} server={server} throughput={realtimeThroughput[server.config.id]}
                      history={timeSeries} compact={mode === "compact"} />
          ) : (
            <ServerCard
              key={server.config.id}
              server={server}
              throughput={realtimeThroughput[server.config.id]}
              history={timeSeries}
            />
          )
        )}
      </div>
    </div>
  );
}
