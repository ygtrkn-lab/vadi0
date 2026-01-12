"use client";
import { motion } from "framer-motion";

export interface MiniLineChartPoint {
  label: string;
  value: number;
}

export function MiniLineChart({
  points,
  max,
  dark,
  height = 160,
  width = 700,
}: {
  points: MiniLineChartPoint[];
  max: number;
  dark?: boolean;
  height?: number;
  width?: number;
}) {
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const toY = (v: number) => height - Math.round((v / Math.max(1, max)) * (height - 40));
  const poly = points
    .map((p, i) => `${i * stepX},${toY(p.value)}`)
    .join(" ");

  return (
    <div className={`rounded-xl p-3 ${dark ? "bg-neutral-900/50" : "bg-gray-50"}`}>
      <motion.svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <line x1="0" y1={height - 20} x2={width} y2={height - 20} stroke={dark ? "#262626" : "#e5e7eb"} />
        <line x1="0" y1={height - 70} x2={width} y2={height - 70} stroke={dark ? "#262626" : "#e5e7eb"} />
        <line x1="0" y1={height - 120} x2={width} y2={height - 120} stroke={dark ? "#262626" : "#e5e7eb"} />
        <motion.polyline
          points={poly}
          fill="none"
          stroke={dark ? "#a855f7" : "#7c3aed"}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {points.map((p, i) => (
          <motion.circle
            key={p.label + i}
            cx={i * stepX}
            cy={toY(p.value)}
            r="3"
            fill={dark ? "#a855f7" : "#7c3aed"}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 + i * 0.05, type: "spring", stiffness: 260, damping: 20 }}
          />
        ))}
      </motion.svg>
      <div className="grid grid-cols-7 gap-2 mt-3">
        {points.map((p, i) => (
          <div key={p.label + i} className={`text-center text-xs ${dark ? "text-neutral-400" : "text-gray-500"}`}>{p.label}</div>
        ))}
      </div>
    </div>
  );
}
