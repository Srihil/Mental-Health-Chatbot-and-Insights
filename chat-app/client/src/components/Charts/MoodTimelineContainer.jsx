// ✅ STEP 1: Modify MoodTimelineContainer.jsx to include forecast

import React, { useEffect, useState } from "react";
import MoodPredictionTimeline from "./MoodPredictionTimeline";
import axios from "../../config/api";

const inferMood = (score, reason) => {
  if (/sleep|tired/i.test(reason)) return "tired";
  if (/anxious|nervous|worry/i.test(reason)) return "anxious";
  if (/angry|frustrated|irritated/i.test(reason)) return "angry";
  if (/happy|joy|excited|positive|good/i.test(reason)) return "happy";
  if (/sad|down|depressed/i.test(reason)) return "sad";
  if (score >= 8) return "happy";
  if (score >= 6) return "calm";
  if (score >= 4) return "anxious";
  return "sad";
};

const MoodTimelineContainer = () => {
  const [moodData, setMoodData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Token missing");
  
        const response = await axios.get("/mood/predictions", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        let enrichedData = response.data.map((entry) => ({
          ...entry,
          mood: entry.mood || inferMood(entry.moodScore, entry.reason),
        }));
  
        // ✅ Group by date and average mood scores
        const grouped = {};
        enrichedData.forEach((entry) => {
          const date = new Date(entry.timestamp).toISOString().split("T")[0];
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(entry.moodScore);
        });
  
        const recent = Object.entries(grouped)
          .slice(-7) // last 7 days
          .map(([ds, scores]) => ({
            ds,
            y: scores.reduce((a, b) => a + b, 0) / scores.length,
          }));
  
  
        const forecastRes = await axios.post("http://localhost:8001/forecast", {
          history: recent,
        });
  
        const {
          prediction: mood,
          moodScore: score,
          confidence,
          reason,
        } = forecastRes.data;
  
        const safeScore = Math.max(0, Math.min(parseFloat(score ?? 0), 9.9));
  
        const nextDay = new Date();
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(12, 0, 0, 0); // midday for clarity
  
        enrichedData.push({
          timestamp: nextDay,
          moodScore: safeScore,
          mood,
          confidence: parseFloat(confidence ?? 0),
          reason: `📈 Predicted: ${reason}`,
          source: "forecast",
        });
  
        setMoodData(enrichedData);
      } catch (err) {
        console.error("❌ Mood Data Fetch Error:", err);
        setError("Failed to load mood data");
      } finally {
        setLoading(false);
      }
    };
  
    fetchMoodData();
  }, []);
  

  if (loading) return <p>Loading mood predictions...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return <MoodPredictionTimeline data={moodData} />;
};

export default MoodTimelineContainer;
