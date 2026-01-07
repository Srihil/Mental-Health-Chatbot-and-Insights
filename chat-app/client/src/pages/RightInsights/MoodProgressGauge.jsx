import React, { useEffect, useState, useContext } from "react";
import { AppContext } from "../../context/AppContext";
import axios from "../../config/api";

const MoodProgressGauge = () => {
  const { chatData, userData } = useContext(AppContext);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = async () => {
      try {
        const botChats = chatData?.filter((chat) => chat.rId === "bot") || [];

        let totalMood = 0;
        let moodEntries = 0;
        let journalCount = 0;

        for (const chat of botChats) {
          // Fetch mood entries
          const moodRes = await axios.get(`/insights/moods/${chat.messageId}`);
          moodEntries += moodRes.data.length;

          const moodWeights = {
            happy: 1,
            excited: 0.9,
            calm: 0.8,
            neutral: 0.6,
            grateful: 0.7,
            bored: 0.4,
            tired: 0.3,
            sad: 0.2,
            stressed: 0.1,
            anxious: 0.1,
            frustrated: 0.05,
          };

          moodRes.data.forEach((m) => {
            const mood = m.mood.toLowerCase();
            totalMood += moodWeights[mood] || 0.5;
          });

          // Fetch journal logs
          const journalRes = await axios.get(`/journal/${chat.messageId}`);
          journalCount += journalRes.data.length;
        }

        const moodScore = moodEntries > 0 ? (totalMood / moodEntries) : 0;
        const normalizedMood = Math.min(1, moodScore);
        const journalBoost = Math.min(1, journalCount / 7);

        const score = Math.round((normalizedMood * 70 + journalBoost * 30) * 100) / 100;
        setProgress(Math.round(score));
      } catch (err) {
        console.error("MoodProgressGauge error:", err);
      }
    };

    calculateProgress();
  }, [chatData, userData]);

  const circleSize = 120;
  const strokeWidth = 10;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        border: "1px solid #e2e8f0",
        marginBottom: "16px",
        padding: "20px",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      }}
    >
      <h3 style={{ fontSize: "1.125rem", marginBottom: "10px" }}>
        Your Wellness Progress
      </h3>
      <svg width={circleSize} height={circleSize}>
        <circle
          stroke="#f3f4f6"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={circleSize / 2}
          cy={circleSize / 2}
        />
        <circle
          stroke="#10b981"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={circleSize / 2}
          cy={circleSize / 2}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
        <text
          x="50%"
          y="52%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="20px"
          fill="#111827"
          fontWeight="bold"
        >
          {progress}%
        </text>
      </svg>
      <p style={{ marginTop: "10px", fontSize: "0.875rem", color: "#6b7280" }}>
        You're {progress}% on your way to emotional balance 💛
      </p>
    </div>
  );
};

export default MoodProgressGauge;
