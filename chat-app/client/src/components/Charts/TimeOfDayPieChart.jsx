import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#a78bfa"];
const TIME_LABELS = ["Morning", "Afternoon", "Evening", "Night"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded px-3 py-2 shadow-md text-sm">
        <p className="font-semibold text-purple-800">{name}</p>
        <p className="text-gray-600">{value} moods</p>
      </div>
    );
  }
  return null;
};

const TimeOfDayPieChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="#334155"
            fontSize="18px"
            fontWeight="bold"
            dy={-6}
          >
            Total
          </text>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            fill="#64748b"
            fontSize="14px"
            dy={14}
          >
            {total}
          </text>
        </PieChart>
      </ResponsiveContainer>

      {/* 🌈 Legend */}
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          flexWrap: "wrap",
        }}
      >
        {TIME_LABELS.map((label, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                backgroundColor: COLORS[i],
                borderRadius: "2px",
              }}
            />
            <span style={{ fontSize: "0.875rem", color: "#475569" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeOfDayPieChart;
