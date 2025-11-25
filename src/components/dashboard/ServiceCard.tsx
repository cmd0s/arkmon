"use client";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import {
  Globe,
  Radio,
  Droplets,
  ArrowLeftRight,
  Search,
  Clock,
  TrendingUp,
  ExternalLink,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  status: "up" | "down" | "degraded" | "unknown";
  latencyMs: number | null;
  uptime24h: number | null;
  avgLatency24h: number | null;
  serviceUrl?: string;
}

const serviceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  portal: LayoutDashboard,
  rpc: Globe,
  ws: Radio,
  faucet: Droplets,
  bridge: ArrowLeftRight,
  explorer: Search,
};

export function ServiceCard({
  id,
  name,
  description,
  status,
  latencyMs,
  uptime24h,
  avgLatency24h,
  serviceUrl,
}: ServiceCardProps) {
  const Icon = serviceIcons[id] || Globe;

  const cardContent = (
    <>
      <CardContent className="p-4">
        {/* Header row - icon, name, badge */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-md",
              status === "up" && "bg-emerald-500/10 text-emerald-400",
              status === "down" && "bg-red-500/10 text-red-400",
              status === "degraded" && "bg-yellow-500/10 text-yellow-400",
              status === "unknown" && "bg-zinc-500/10 text-zinc-400"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">{name}</span>
            {serviceUrl && (
              <ExternalLink className="h-3 w-3 text-zinc-500" />
            )}
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Description - fixed height */}
        <p className="text-xs text-zinc-500 mb-4 h-4">{description}</p>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5">
              <Clock className="h-2.5 w-2.5" />
              Latency
            </div>
            <span className={cn(
              "text-base font-semibold",
              latencyMs && latencyMs > 2000 ? "text-yellow-400" : "text-white"
            )}>
              {latencyMs !== null ? `${latencyMs}ms` : "—"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              Uptime
            </div>
            <span className={cn(
              "text-base font-semibold",
              uptime24h !== null && uptime24h < 99 ? "text-yellow-400" : "text-white",
              uptime24h !== null && uptime24h < 95 && "text-red-400"
            )}>
              {uptime24h !== null ? `${uptime24h}%` : "—"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-0.5">
              <Clock className="h-2.5 w-2.5" />
              Avg 24h
            </div>
            <span className="text-base font-semibold text-white">
              {avgLatency24h !== null ? `${avgLatency24h}ms` : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </>
  );

  const cardClassName = cn(
    "bg-zinc-900/50 border-zinc-800 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80",
    status === "down" && "border-red-900/50",
    status === "degraded" && "border-yellow-900/50",
    serviceUrl && "cursor-pointer"
  );

  if (serviceUrl) {
    return (
      <a href={serviceUrl} target="_blank" rel="noopener noreferrer" className="block">
        <Card className={cardClassName}>
          {cardContent}
        </Card>
      </a>
    );
  }

  return (
    <Card className={cardClassName}>
      {cardContent}
    </Card>
  );
}
