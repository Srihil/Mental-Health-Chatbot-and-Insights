import express from "express";
import MoodEntry from "../models/MoodEntry.js";

const router = express.Router();

/**
 * Calculate standard deviation (sample stddev for n > 1)
 */
const getStdDev = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
};

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const moodEntries = await MoodEntry.find({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    if (moodEntries.length === 0) {
      return res.json({
        radarData: [],
        emotionalBalance: 0,
      });
    }

    const moodCounts = {};

    moodEntries.forEach((entry) => {
      const mood = entry.mood;
      const score = entry.moodScore ?? entry.confidence ?? 0;

      if (!moodCounts[mood]) moodCounts[mood] = [];
      moodCounts[mood].push(score);
    });

    const radarData = Object.entries(moodCounts).map(([mood, scores]) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const volatility = getStdDev(scores);
      return {
        mood,
        average: Number(avg.toFixed(2)),
        volatility: Number(volatility.toFixed(2)),
        count: scores.length,
      };
    });

    const totalSamples = Object.values(moodCounts).reduce(
      (sum, arr) => sum + arr.length,
      0
    );

    const weightedVolatility = radarData.reduce((acc, m) => {
      return acc + (m.volatility * m.count) / totalSamples;
    }, 0);

    // Scale volatility (0 = perfect stability, higher = less stable)
    const emotionalBalance = Math.max(
      0,
      Math.min(100, Math.round(100 - weightedVolatility * 10))
    );

    // Clean output for frontend
    const cleanedRadarData = radarData.map(({ mood, average, volatility }) => ({
      mood,
      average,
      volatility,
    }));

    res.json({
      radarData: cleanedRadarData,
      emotionalBalance,
    });
  } catch (err) {
    console.error("❌ Emotion stability error:", err.message);
    res.status(500).json({ error: "Failed to analyze emotion stability" });
  }
});

export default router;
