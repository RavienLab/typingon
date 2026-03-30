"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type WpmPoint = {
  t: number;
  wpm: number;
};

export function WpmChart({ timeline }: { timeline: WpmPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart
        data={timeline}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        {/* very subtle grid */}
        <CartesianGrid
          stroke="#1e293b"
          strokeDasharray="3 3"
          vertical={false}
        />

        {/* hide noisy axis labels */}
        <XAxis dataKey="t" hide />
        <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />

        <Tooltip
          cursor={false}
          contentStyle={{
            background: "#0f172a",
            border: "1px solid #1e293b",
            borderRadius: "8px",
          }}
          labelStyle={{ color: "#94a3b8" }}
        />

        <Line
          type="monotone"
          dataKey="wpm"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={false}
          strokeLinecap="round"
          style={{
            filter: "drop-shadow(0 0 8px rgba(59,130,246,0.6))",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
