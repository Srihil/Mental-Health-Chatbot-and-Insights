// RightInsights/EmotionBreakdown.jsx
import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";

const EmotionBreakdown = () => {
  const { chatData, userData } = useContext(AppContext);
  const [emotionData, setEmotionData] = useState([]);

  useEffect(() => {
    const fetchEmotionData = async () => {
      try {
        const botChats = chatData?.filter((chat) => chat.rId === "bot") || [];
        const moodCounts = {};
        const colorMap = {
          happy: "#10b981",
          stressed: "#f59e0b",
          neutral: "#60a5fa",
          sad: "#8b5cf6",
          excited: "#eab308",
          calm: "#34d399",
          tired: "#f472b6",
          anxious: "#f87171",
          frustrated: "#f43f5e",
          grateful: "#38bdf8",
        };

        for (const chat of botChats) {
          const res = await axios.get(`/insights/moods/${chat.messageId}`);
          res.data.forEach((entry) => {
            const mood = entry.mood.toLowerCase();
            moodCounts[mood] = (moodCounts[mood] || 0) + 1;
          });
        }

        const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);

        const result = Object.entries(moodCounts).map(([emotion, count]) => ({
          emotion,
          percentage: ((count / total) * 100).toFixed(1),
          color: colorMap[emotion] || "#ddd",
        }));

        setEmotionData(
          result.sort(
            (a, b) => parseFloat(b.percentage) - parseFloat(a.percentage)
          )
        );
      } catch (err) {
        console.error("Emotion fetch error", err);
      }
    };

    fetchEmotionData();
  }, [chatData, userData]);

  const styles = {
    card: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      marginBottom: "16px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    header: {
      padding: "16px 20px 8px",
      borderBottom: "1px solid #f1f5f9",
      fontSize: "1.125rem",
      fontWeight: 500,
    },
    content: {
      padding: "20px",
    },
    list: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    item: {},
    top: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "0.875rem",
    },
    bar: {
      width: "100%",
      height: "8px",
      backgroundColor: "#f1f5f9",
      borderRadius: "4px",
      overflow: "hidden",
    },
    fill: (width, color) => ({
      width: `${width}%`,
      height: "100%",
      backgroundColor: color,
      borderRadius: "4px",
    }),
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>Emotion Breakdown</div>
      <div style={styles.content}>
        <div style={styles.list}>
          {emotionData.map((item, i) => (
            <div key={i} style={styles.item}>
              <div style={styles.top}>
                <span>{item.emotion}</span>
                <span>{item.percentage}%</span>
              </div>
              <div style={styles.bar}>
                <div style={styles.fill(item.percentage, item.color)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmotionBreakdown;
