"use client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface SpendDataPoint {
  label: string;
  total: number;
}

interface SpendChartProps {
  data: SpendDataPoint[];
  type?: "bar" | "line";
  title?: string;
  height?: number;
}

const formatter = (value: number) => `$${(value / 1000).toFixed(0)}K`;

export default function SpendChart({ data, type = "bar", title, height = 300 }: SpendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No spend data available
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickFormatter={formatter} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]} />
            <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tickFormatter={formatter} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]} />
            <Legend />
            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}