"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "up" | "down" | "degraded" | "unknown";
  showPulse?: boolean;
}

export function StatusBadge({ status, showPulse = true }: StatusBadgeProps) {
  const statusConfig = {
    up: {
      label: "Operational",
      bgColor: "bg-emerald-500/20",
      textColor: "text-emerald-400",
      dotColor: "bg-emerald-500",
    },
    down: {
      label: "Down",
      bgColor: "bg-red-500/20",
      textColor: "text-red-400",
      dotColor: "bg-red-500",
    },
    degraded: {
      label: "Degraded",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-400",
      dotColor: "bg-yellow-500",
    },
    unknown: {
      label: "Unknown",
      bgColor: "bg-zinc-500/20",
      textColor: "text-zinc-400",
      dotColor: "bg-zinc-500",
    },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
        config.bgColor,
        config.textColor
      )}
    >
      <span className="relative flex h-2 w-2">
        {showPulse && status === "up" && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              config.dotColor
            )}
          />
        )}
        <span
          className={cn("relative inline-flex rounded-full h-2 w-2", config.dotColor)}
        />
      </span>
      {config.label}
    </div>
  );
}
