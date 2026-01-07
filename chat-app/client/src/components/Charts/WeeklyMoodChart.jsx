import React from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

const WeeklyMoodChart = ({ weeklyMoodData }) => {
  if (!weeklyMoodData || weeklyMoodData.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📉</div>
        <p style={{ color: "#64748b", fontSize: "18px", fontWeight: "500", marginBottom: "8px" }}>
          No mood data yet
        </p>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
          Start chatting to generate insights
        </p>
      </div>
    );
  }

  // 🔧 Tooltip with day & mood score
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const score = payload[0].payload.mood;
      let interpretedMood = "";
      let emoji = "";
  
      if (score <= 3) {
        interpretedMood = "Low Mood (Sad / Anxious)";
        emoji = "😔";
      } else if (score <= 6) {
        interpretedMood = "Neutral / Calm Mood";
        emoji = "😐";
      } else {
        interpretedMood = "Positive Mood (Happy / Grateful)";
        emoji = "😊";
      }
  
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            fontSize: "13px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            color: "#334155",
          }}
        >
          <div style={{ fontWeight: "600", marginBottom: "4px", color: "#4f46e5" }}>
            {payload[0].payload.day}
          </div>
          <div>
            Mood Score:{" "}
            <strong>{score.toFixed(2)} / 10</strong> {emoji}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
            {interpretedMood}
          </div>
        </div>
      );
    }
    return null;
  };
  

  return (
    <div
      style={{
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        border: "1px solid #e2e8f0",
        padding: "16px 40px 24px 0px", // ⬅️ Added left shift
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle background pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #8884d8 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={weeklyMoodData}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#334155" }} />
          <YAxis
            domain={[0, 10]}
            tick={{ fontSize: 12, fill: "#334155" }}
            tickCount={6}
            label={{
              value: "Mood (0–10)",
              angle: -90,
              position: "insideLeft",
              style: { fill: "#64748b", fontSize: 12 },
              offset: -10,
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#4f46e5"
            fill="url(#moodGradient)"
            strokeWidth={3}
            dot={{ r: 4, fill: "#8b5cf6" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Mood Scale Legend */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "#94a3b8",
          paddingLeft: "40px"

        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "16px",
              height: "4px",
              background: "linear-gradient(to right, #fca5a5, #fde047, #86efac)",
              borderRadius: "2px",
            }}
          />
          <span>Mood Scale: 0 (Low) → 10 (High)</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyMoodChart;
