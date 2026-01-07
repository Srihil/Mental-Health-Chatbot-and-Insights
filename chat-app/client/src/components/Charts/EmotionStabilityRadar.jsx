// src/components/MainInsights/EmotionStabilityRadar.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "../../config/api";
import { AppContext } from "../../context/AppContext";
import { Activity, Heart, TrendingUp, Loader2, AlertCircle } from "lucide-react";

const EmotionStabilityRadar = () => {
  const { userData } = useContext(AppContext);

  const [data, setData] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?._id) return;

    (async () => {
      try {
        const res = await axios.get(`/emotion-stability/${userData._id}`);
        const rawRadar = res.data?.radarData || [];
        const mapped = rawRadar.map((r) => ({
          emotion: r.mood,
          value: r.average,
        }));

        setData(mapped);
        setBalance(res.data?.emotionalBalance ?? null);
      } catch (err) {
        console.error("❌ Emotion‑stability fetch failed:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [userData]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div style={{
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          fontSize: "14px",
          minWidth: "140px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <Heart size={14} style={{ color: "#6366f1" }} />
            <span style={{ fontWeight: "600", color: "#1e293b" }}>{label}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <TrendingUp size={12} style={{ color: "#10b981" }} />
            <span style={{ color: "#64748b", fontSize: "13px" }}>Stability: </span>
            <span style={{ fontWeight: "600", color: "#059669" }}>{value.toFixed(1)}/10</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBalanceColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f59e0b";
    if (score >= 40) return "#f97316";
    return "#ef4444";
  };

  const getBalanceText = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Attention";
  };

  if (loading) {
    return (
      <div style={{
        padding: "32px",
        marginBottom: "24px",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        borderRadius: "20px",
        border: "1px solid #e2e8f0",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "8px" }}>
          <Loader2 size={20} style={{ color: "#6366f1", animation: "spin 1s linear infinite" }} />
          <span style={{ color: "#64748b", fontSize: "16px", fontWeight: "500" }}>
            Loading emotional stability data...
          </span>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{
        padding: "32px",
        marginBottom: "24px",
        background: "linear-gradient(135deg, #fef7f0 0%, #fef3e2 100%)",
        borderRadius: "20px",
        border: "1px solid #fed7aa",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "8px" }}>
          <AlertCircle size={20} style={{ color: "#f59e0b" }} />
          <span style={{ color: "#92400e", fontSize: "16px", fontWeight: "500" }}>
            Insufficient Data
          </span>
        </div>
        <p style={{ color: "#a16207", fontSize: "14px", margin: "0" }}>
          Not enough data for a stability chart yet. Keep tracking your emotions!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: "28px",
      marginBottom: "20px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      borderRadius: "20px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      position: "relative",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", zIndex: 1 }}>
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          borderRadius: "12px",
          padding: "8px",
        }}>
          <Activity size={20} style={{ color: "white",top: "3.5px",position: "relative" }} />
        </div>
        <div>
          <h3 style={{
            margin: "0 0 4px 0",
            fontSize: "20px",
            fontWeight: "700",
            background: "linear-gradient(135deg, #1e293b, #475569)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Emotion Stability Radar
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "14px", fontWeight: "500" }}>
            Last 7 days emotional patterns
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      <div style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid rgba(255, 255, 255, 0.5)",
      }}>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart outerRadius="85%" data={data}>
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="#cbd5e1" strokeOpacity={0.6} />
            <PolarAngleAxis
              dataKey="emotion"
              tick={{ fontSize: 13, fontWeight: 600, fill: "#475569" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Stability"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              fill="url(#radarGradient)"
              fillOpacity={0.3}
              dot={{ r: 5, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }}
              activeDot={{ r: 7, stroke: "#ffffff", strokeWidth: 3 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Balance Score */}
      {balance !== null && (
        <>
          <div style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Heart size={18} style={{ color: getBalanceColor(balance) }} />
              <span style={{ fontSize: "15px", color: "#475569", fontWeight: "500" }}>
                Emotional Balance Score
              </span>
            </div>
            <div style={{ fontSize: "18px", fontWeight: "700", color: getBalanceColor(balance) }}>
              {balance} / 100
            </div>
          </div>
          <div style={{
            marginTop: "12px",
            height: "6px",
            background: "#e2e8f0",
            borderRadius: "3px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${balance}%`,
              background: getBalanceColor(balance),
              transition: "width 1s ease-out",
            }} />
          </div>
        </>
      )}
    </div>
  );
};

export default EmotionStabilityRadar;
