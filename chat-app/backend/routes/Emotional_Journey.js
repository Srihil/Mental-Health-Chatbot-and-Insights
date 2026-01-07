// routes/Emotional_Journal.js
import express from "express";
import MoodEntry from "../models/MoodEntry.js";
import Journal from "../models/Journal.js";
import nlp from "compromise";

const router = express.Router();

// GET /api/insights/emotional-journey/:userId
router.get("/emotional-journey/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    // Fetch last 14 days of mood data
    const moodData = await MoodEntry.find({
      userId,
      createdAt: { $gte: twoWeeksAgo },
    });

    // Fetch last 14 days of journal entries
    const journals = await Journal.find({
      userId,
      createdAt: { $gte: twoWeeksAgo },
    });

    // Group mood data into this week vs last week
    const thisWeek = moodData.filter((m) => new Date(m.createdAt) >= oneWeekAgo);
    const lastWeek = moodData.filter((m) => new Date(m.createdAt) < oneWeekAgo);

    // Helper: Average mood score
    const avg = (arr) =>
      arr.length
        ? arr.reduce((sum, mood) => sum + (mood.moodScore || 0), 0) / arr.length
        : 0;

    const thisWeekAvg = avg(thisWeek);
    const lastWeekAvg = avg(lastWeek);

    const boost =
      lastWeekAvg === 0
        ? 0
        : ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;

    // Sort moods by score
    const sorted = moodData.filter(m => typeof m.moodScore === 'number').sort(
      (a, b) => b.moodScore - a.moodScore
    );
    const peak = sorted[0];
    const low = sorted[sorted.length - 1];

    const formatTime = (entry) =>
      entry
        ? new Date(entry.createdAt).toLocaleString("en-IN", {
            weekday: "long",
            hour: "numeric",
            hour12: true,
          })
        : "Not enough data";

    // NLP: Extract emotional themes using compromise
    const allText = journals.map((j) => j.content.trim()).join(" ");
    const doc = nlp(allText);

    const topWords = doc
      .terms()
      .filter((term) => {
        const tags = term.tags || [];
        return (
          (tags.includes("Noun") ||
            tags.includes("Adjective") ||
            tags.includes("Verb")) &&
          term.normal &&
          term.normal.length > 3
        );
      })
      .out("frequency")
      .slice(0, 5)
      .map((w) => w.normal);

    res.json({
      moodBoost: Math.round(boost),
      peakDayTime: formatTime(peak),
      lowDayTime: formatTime(low),
      themes: topWords.length ? topWords : ["Not enough data"],
    });
  } catch (err) {
    console.error("❌ Emotional Journey Error:", err.message);
    res.status(500).json({ message: "Failed to compute emotional journey" });
  }
});

export default router;
