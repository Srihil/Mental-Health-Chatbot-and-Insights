// src/components/Charts/EmotionFrequencyChart.jsx

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const emotionColorMap = {
  happy: "#34d399",       // green
  excited: "#06b6d4",     // cyan
  grateful: "#facc15",    // yellow
  calm: "#60a5fa",        // soft blue
  neutral: "#a3a3a3",     // gray
  bored: "#8b5cf6",       // violet
  tired: "#f97316",       // orange
  frustrated: "#ef4444",  // red
  anxious: "#e11d48",     // rose
  sad: "#3b82f6",         // blue
  Others: "#9ca3af",      // cool gray fallback
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { emotion, count } = payload[0].payload;
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "8px 12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        }}
      >
        <p
          style={{
            fontWeight: 600,
            color: emotionColorMap[emotion] || "#6b7280",
            marginBottom: 4,
          }}
        >
          {emotion}
        </p>
        <p style={{ fontSize: 13, color: "#334155" }}>
          Count: <strong>{count}</strong>
        </p>
      </div>
    );
  }
  return null;
};

const EmotionFrequencyChart = ({ data }) => {
  const getBarColor = (emotion) => {
    return emotionColorMap[emotion] || "#9ca3af"; // fallback gray
  };

  return (
    <div style={{ backgroundColor: "white", borderRadius: 8, padding: 8 }}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="emotion"
            tick={{ fontSize: 12, fill: "#475569" }}
          />
          <YAxis tick={{ fontSize: 12, fill: "#475569" }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.emotion)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionFrequencyChart;
