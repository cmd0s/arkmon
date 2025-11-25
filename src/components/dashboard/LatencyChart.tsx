"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useMemo } from "react";
import { SERVICES } from "@/config/testnets";

interface MetricData {
  timestamp: string;
  service: string;
  latencyMs: number | null;
  status: string;
}

interface LatencyChartProps {
  data: Record<string, MetricData[]>;
}

const serviceColors: Record<string, string> = {
  rpc: "#10b981",
  ws: "#6366f1",
  faucet: "#f59e0b",
  bridge: "#ec4899",
  explorer: "#8b5cf6",
};

export function LatencyChart({ data }: LatencyChartProps) {
  const chartData = useMemo(() => {
    // Get all unique timestamps and create chart data points
    const timeMap = new Map<number, Record<string, number | null>>();

    for (const [service, metrics] of Object.entries(data)) {
      for (const metric of metrics) {
        const time = new Date(metric.timestamp).getTime();
        if (!timeMap.has(time)) {
          timeMap.set(time, {});
        }
        timeMap.get(time)![service] = metric.latencyMs;
      }
    }

    // Convert to array and sort by time
    return Array.from(timeMap.entries())
      .map(([time, values]) => ({
        time,
        timeLabel: new Date(time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        ...values,
      }))
      .sort((a, b) => a.time - b.time)
      .slice(-60); // Last 60 data points
  }, [data]);

  const services = Object.keys(data);

  if (chartData.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            Response Time
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-zinc-500">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400">
          Response Time (ms)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="timeLabel"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#fafafa" }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) =>
                SERVICES.find((s) => s.id === value)?.name || value
              }
            />
            {services.map((service) => (
              <Line
                key={service}
                type="monotone"
                dataKey={service}
                stroke={serviceColors[service] || "#71717a"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
