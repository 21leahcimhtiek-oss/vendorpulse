"use client";
import { useMemo } from "react";

interface RiskItem {
  id: string;
  name: string;
  likelihood: number; // 1-5
  impact: number;     // 1-5
  severity: string;
}

interface RiskMatrixProps {
  items: RiskItem[];
}

const severityColorMap: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};

const cellColors = [
  ["bg-green-50","bg-green-100","bg-yellow-50","bg-orange-50","bg-red-50"],
  ["bg-green-100","bg-yellow-50","bg-yellow-100","bg-orange-100","bg-red-100"],
  ["bg-yellow-50","bg-yellow-100","bg-orange-50","bg-orange-100","bg-red-200"],
  ["bg-orange-50","bg-orange-100","bg-orange-200","bg-red-100","bg-red-300"],
  ["bg-orange-100","bg-orange-200","bg-red-100","bg-red-200","bg-red-400"],
];

export default function RiskMatrix({ items }: RiskMatrixProps) {
  const grid = useMemo(() => {
    const m: Record<string, RiskItem[]> = {};
    items.forEach((item) => {
      const key = `${item.likelihood}-${item.impact}`;
      if (!m[key]) m[key] = [];
      m[key].push(item);
    });
    return m;
  }, [items]);

  return (
    <div className="overflow-auto">
      <div className="flex items-center gap-2 mb-3 text-xs text-slate-500">
        <span className="font-medium">Risk Matrix</span>
        <span>·</span>
        <span>Y-axis: Likelihood · X-axis: Impact</span>
      </div>
      <div className="inline-grid" style={{ gridTemplateColumns: "40px repeat(5, 80px)", gridTemplateRows: "repeat(5, 60px) 40px" }}>
        {[5, 4, 3, 2, 1].map((likelihood) =>
          Array.from({ length: 5 }, (_, impactIdx) => {
            const impact = impactIdx + 1;
            const key = `${likelihood}-${impact}`;
            const cellItems = grid[key] ?? [];
            const colorClass = cellColors[5 - likelihood]?.[impactIdx] ?? "bg-slate-50";
            return (
              <div
                key={key}
                className={`${colorClass} border border-white/50 relative flex flex-wrap gap-1 items-start p-1 ${impactIdx === 0 ? "ml-10" : ""}`}
                title={`Likelihood ${likelihood}, Impact ${impact}`}
              >
                {cellItems.map((item) => (
                  <div
                    key={item.id}
                    className={`w-4 h-4 rounded-full ${severityColorMap[item.severity] ?? "bg-slate-400"} cursor-pointer flex-shrink-0`}
                    title={item.name}
                  />
                ))}
              </div>
            );
          })
        )}
        {/* Axis labels */}
        {[5, 4, 3, 2, 1].map((l) => (
          <div key={l} className="flex items-center justify-end pr-1 text-xs text-slate-400 font-medium" style={{ gridColumn: 1, gridRow: 6 - l }}>
            {l}
          </div>
        ))}
        <div className="col-span-5 flex items-center justify-center text-xs text-slate-400 mt-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-20 text-center font-medium">{i}</div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-3 flex-wrap">
        {Object.entries(severityColorMap).map(([severity, color]) => (
          <div key={severity} className="flex items-center gap-1.5 text-xs text-slate-600 capitalize">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            {severity}
          </div>
        ))}
      </div>
    </div>
  );
}