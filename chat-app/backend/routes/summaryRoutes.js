// routes/summaryRoutes.js
import express from "express";
import axios from "axios";
import MoodEntry from "../models/MoodEntry.js";
import AISummary from "../models/AISummary.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/summary/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    const [existing, latestMood] = await Promise.all([
      AISummary.findOne({ userId }),
      MoodEntry.findOne({ userId }).sort({ createdAt: -1 }),
    ]);

    if (!latestMood) {
      return res.json({ summary: "No mood data available yet. Start journaling to get insights!" });
    }

    if (existing && new Date(latestMood.createdAt) < new Date(existing.updatedAt)) {
      return res.json({ summary: existing.summary });
    }

    const entries = await MoodEntry.find({ userId }).sort({ createdAt: -1 });
    const moodCount = {};
    const timeBuckets = { morning: 0, afternoon: 0, evening: 0, night: 0 };

    for (let entry of entries) {
      const mood = entry.mood.toLowerCase();
      moodCount[mood] = (moodCount[mood] || 0) + 1;

      const hour = new Date(entry.createdAt).getHours();
      if (hour >= 5 && hour < 12) timeBuckets.morning++;
      else if (hour >= 12 && hour < 17) timeBuckets.afternoon++;
      else if (hour >= 17 && hour < 21) timeBuckets.evening++;
      else timeBuckets.night++;
    }

    const moodStats = Object.entries(moodCount).map(([m, c]) => `${m}: ${c}`).join(", ");
    const timeStats = Object.entries(timeBuckets).map(([t, c]) => `${t}: ${c}`).join(", ");

    const prompt = `
You're a mental health assistant summarizing user emotion trends.
Mood summary:
- Emotions: ${moodStats}
- Time pattern: ${timeStats}
Write a short, concise summary (max 2 sentences). Suggest 1 self-care tip.`.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: "You generate short, supportive mood summaries for mental health users." },
          { role: "user", content: prompt },
        ],
        max_tokens: 180,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const summary = response.data.choices?.[0]?.message?.content?.trim();

    await AISummary.findOneAndUpdate(
      { userId },
      { summary, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ summary });
  } catch (err) {
    console.error("❌ AI summary error:", err.message);
    res.status(500).json({ summary: "AI summary failed. Try again later." });
  }
});

export default router;
