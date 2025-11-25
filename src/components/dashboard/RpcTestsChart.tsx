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

interface RpcTestData {
  timestamp: Date;
  operation: string;
  durationMs: number;
  success: number;
}

interface RpcAverage {
  operation: string;
  avgDurationMs: number;
  successRate: number;
  count: number;
}

interface RpcTestsChartProps {
  tests: Record<string, RpcTestData[]>;
  averages: RpcAverage[];
}

const operationLabels: Record<string, string> = {
  write_small: "Write Small",
  write_large: "Write Large",
  read: "Read",
};

const operationColors: Record<string, string> = {
  write_small: "#10b981",
  write_large: "#6366f1",
  read: "#f59e0b",
};

export function RpcTestsChart({ tests, averages }: RpcTestsChartProps) {
  const chartData = useMemo(() => {
    // Get all unique timestamps and create chart data points
    const timeMap = new Map<number, Record<string, number | null>>();

    for (const [operation, testList] of Object.entries(tests)) {
      for (const test of testList) {
        const time = new Date(test.timestamp).getTime();
        if (!timeMap.has(time)) {
          timeMap.set(time, {});
        }
        // Only include successful tests in the chart (failed tests would skew the data)
        if (test.success) {
          timeMap.get(time)![operation] = test.durationMs;
        }
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
  }, [tests]);

  const operations = Object.keys(tests);

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
          RPC Response Time (ms)
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
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "#a1a1aa" }}
              itemStyle={{ color: "#fafafa" }}
              formatter={(value: number) => [`${value}ms`, ""]}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => operationLabels[value] || value}
            />
            {operations.map((operation) => (
              <Line
                key={operation}
                type="monotone"
                dataKey={operation}
                name={operation}
                stroke={operationColors[operation] || "#71717a"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Success rate stats below the chart */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          {averages.map((item) => (
            <div
              key={item.operation}
              className="text-center p-3 rounded-lg bg-zinc-800/50"
            >
              <div className="text-xs text-zinc-500 mb-1">
                {operationLabels[item.operation] || item.operation}
              </div>
              <div className="text-lg font-semibold text-white">
                {item.successRate.toFixed(1)}%
              </div>
              <div className="text-xs text-zinc-500">
                avg {item.avgDurationMs >= 1000
                  ? `${(item.avgDurationMs / 1000).toFixed(1)}s`
                  : `${item.avgDurationMs}ms`}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
