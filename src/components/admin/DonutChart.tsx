"use client";
import { motion } from "framer-motion";

export interface DonutSegment {
  value: number;
  color: string; // hex or any CSS color
  label?: string;
}

export function DonutChart({
  segments,
  size = 140,
  thickness = 16,
  dark,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  dark?: boolean;
}) {
  const total = Math.max(1, segments.reduce((s, x) => s + (x.value || 0), 0));

  // Build conic-gradient stops
  let current = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    const pct = (Math.max(0, seg.value || 0) / total) * 100;
    const start = current;
    const end = current + pct;
    stops.push(`${seg.color} ${start}% ${end}%`);
    current = end;
  }
  const gradient = stops.length > 0 ? `conic-gradient(${stops.join(", ")})` : (dark ? "#111827" : "#f3f4f6");

  const inner = size - thickness * 2;

  return (
    <div className={`flex items-center gap-4 ${dark ? "text-neutral-300" : "text-gray-700"}`}>
      <motion.div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Base ring with conic gradient */}
        <div
          className="rounded-full"
          style={{
            width: size,
            height: size,
            background: gradient,
          }}
        />
        {/* Inner hole to make it a donut */}
        <div
          className="absolute rounded-full"
          style={{
            top: thickness,
            left: thickness,
            width: inner,
            height: inner,
            background: dark ? "#0a0a0a" : "#ffffff",
          }}
        />
        {/* Border for contrast */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: dark
              ? "inset 0 0 0 1px #1f2937"
              : "inset 0 0 0 1px #e5e7eb",
          }}
        />
      </motion.div>
      <div className="space-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: seg.color }} />
            <span>{seg.label ?? ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
