"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function DonutChart({ up, down }: { up: number; down: number }) {
  const data = [
    { name: "UP", value: up },
    { name: "DOWN", value: down }
  ];

  const COLORS = {
    UP: "#22c55e",    // verde
    DOWN: "#ef4444"   // vermelho
  } as const;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="value"
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            isAnimationActive
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.name === "UP" ? COLORS.UP : COLORS.DOWN} />
            ))}
          </Pie>

          <Tooltip
            formatter={(v: number, n: string) => [v, n]}
            contentStyle={{ backdropFilter: "blur(6px)" } as any}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(v) => (
              <span style={{ opacity: 0.9 }}>
                {v === "UP" ? "Antenas UP" : "Antenas DOWN"}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
