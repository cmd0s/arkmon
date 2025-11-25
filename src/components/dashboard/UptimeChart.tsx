"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/config/testnets";

interface MetricData {
  timestamp: string;
  service: string;
  status: string;
}

interface UptimeChartProps {
  data: Record<string, MetricData[]>;
  hours?: number;
}

export function UptimeChart({ data, hours = 24 }: UptimeChartProps) {
  const uptimeData = useMemo(() => {
    return SERVICES.map((service) => {
      const metrics = data[service.id] || [];
      const total = metrics.length;
      const up = metrics.filter((m) => m.status === "up").length;
      const uptime = total > 0 ? ((up / total) * 100).toFixed(2) : null;

      // Create timeline data (last 24 slots)
      const slots = 48; // 30-minute slots for 24 hours
      const slotDuration = (hours * 60 * 60 * 1000) / slots;
      const now = Date.now();

      const timeline = Array.from({ length: slots }, (_, i) => {
        const slotStart = now - (slots - i) * slotDuration;
        const slotEnd = slotStart + slotDuration;

        const slotMetrics = metrics.filter((m) => {
          const t = new Date(m.timestamp).getTime();
          return t >= slotStart && t < slotEnd;
        });

        if (slotMetrics.length === 0) return "unknown";
        const hasDown = slotMetrics.some((m) => m.status === "down");
        const hasDegraded = slotMetrics.some((m) => m.status === "degraded");
        if (hasDown) return "down";
        if (hasDegraded) return "degraded";
        return "up";
      });

      return {
        id: service.id,
        name: service.name,
        uptime,
        timeline,
      };
    });
  }, [data, hours]);

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          Uptime ({hours}h)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {uptimeData.map((service) => (
          <div key={service.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-300">{service.name}</span>
              <span
                className={cn(
                  "text-sm font-medium",
                  service.uptime === null && "text-zinc-500",
                  service.uptime !== null &&
                    parseFloat(service.uptime) >= 99 &&
                    "text-emerald-400",
                  service.uptime !== null &&
                    parseFloat(service.uptime) >= 95 &&
                    parseFloat(service.uptime) < 99 &&
                    "text-yellow-400",
                  service.uptime !== null &&
                    parseFloat(service.uptime) < 95 &&
                    "text-red-400"
                )}
              >
                {service.uptime !== null ? `${service.uptime}%` : "—"}
              </span>
            </div>
            <div className="flex gap-0.5">
              {service.timeline.map((status, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-6 flex-1 rounded-sm transition-colors",
                    status === "up" && "bg-emerald-500/80 hover:bg-emerald-500",
                    status === "down" && "bg-red-500/80 hover:bg-red-500",
                    status === "degraded" && "bg-yellow-500/80 hover:bg-yellow-500",
                    status === "unknown" && "bg-zinc-800 hover:bg-zinc-700"
                  )}
                  title={`${hours - (i * hours) / 48}h ago: ${status}`}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-end gap-4 pt-2 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-yellow-500" />
            <span>Degraded</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span>Down</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-zinc-800" />
            <span>No data</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
