"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface RpcAverage {
  operation: string;
  avgDurationMs: number;
  successRate: number;
  count: number;
}

interface RpcTestsChartProps {
  averages: RpcAverage[];
}

const operationLabels: Record<string, string> = {
  write_small: "Write Small (<1KB)",
  write_large: "Write Large (~100KB)",
  read: "Read",
};

const operationColors: Record<string, string> = {
  write_small: "#10b981",
  write_large: "#6366f1",
  read: "#f59e0b",
};

export function RpcTestsChart({ averages }: RpcTestsChartProps) {
  const chartData = averages.map((avg) => ({
    name: operationLabels[avg.operation] || avg.operation,
    operation: avg.operation,
    duration: avg.avgDurationMs,
    successRate: avg.successRate,
    count: avg.count,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-400">
            RPC Performance
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
          RPC Performance (avg ms)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
            <XAxis
              type="number"
              stroke="#71717a"
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(value: number, name: string) => {
                if (name === "duration") return [`${value}ms`, "Avg Duration"];
                return [value, name];
              }}
            />
            <Bar
              dataKey="duration"
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={operationColors[entry.operation] || "#71717a"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 grid grid-cols-3 gap-4">
          {chartData.map((item) => (
            <div
              key={item.operation}
              className="text-center p-3 rounded-lg bg-zinc-800/50"
            >
              <div className="text-xs text-zinc-500 mb-1">{item.name}</div>
              <div className="text-lg font-semibold text-white">
                {item.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-zinc-500">success rate</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
