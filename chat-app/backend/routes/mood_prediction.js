// File: routes/moodPrediction.js

import express from "express";
import axios from "axios";
import verifyToken from "../middleware/verifyToken.js";
import MoodEntry from "../models/MoodEntry.js";
import Journal from "../models/Journal.js";
import Message from "../models/Message.js";

const router = express.Router();

const convertToScore = (mood) => {
  const map = {
    happy: 9,
    calm: 7,
    grateful: 8,
    neutral: 5,
    bored: 4,
    anxious: 3,
    sad: 2,
    frustrated: 1,
    tired: 3,
  };
  return map[mood] || 5; // default to neutral
};

router.get("/predictions", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Step 1: Fetch all mood-related text
    const [moodEntries, journals, messages] = await Promise.all([
      MoodEntry.find({ userId }),
      Journal.find({ userId }),
      Message.find({ "messages.senderId": userId }),
    ]);

    // Step 2: Combine all user-authored texts with timestamps
    const allTexts = [];

    // From MoodEntry (already analyzed)
    moodEntries.forEach((entry) => {
      if (entry.originalText) {
        allTexts.push({
          text: entry.originalText,
          source: "mood",
          timestamp: entry.createdAt,
        });
      }
    });

    // From Journals
    journals.forEach((entry) => {
      if (entry.content) {
        allTexts.push({
          text: entry.content,
          source: "journal",
          timestamp: entry.createdAt,
        });
      }
    });

    // From Chat messages
    messages.forEach((doc) => {
      doc.messages
        .filter((msg) => msg.senderId === userId && msg.text)
        .forEach((msg) => {
          allTexts.push({
            text: msg.text,
            source: "chat",
            timestamp: msg.createdAt,
          });
        });
    });

    // Step 3: Sort chronologically
    allTexts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Step 4: Send each to model.py server after filtering weak inputs
    const predictions = await Promise.all(
      allTexts.map(async ({ text, timestamp, source }) => {
        // 🧠 Skip weak or meaningless inputs
        const cleanText = text.trim();
        const wordCount = cleanText.split(/\s+/).length;
        if (cleanText.length < 5 || wordCount < 3) {
          return null;
        }

        try {
          const { data } = await axios.post("http://localhost:8001/analyze", { text: cleanText });

          if (data.confidence <= 0.1) {
            return null;
          }

          return {
            timestamp,
            moodScore: convertToScore(data.mood),
            confidence: data.confidence,
            reason: `${source} entry: "${cleanText.slice(0, 100)}..."`,
            mood: data.mood,
            sentiment: data.sentiment,
            source,
          };
        } catch (err) {
          console.error("❌ Mood analysis failed:", err.message);
          return null;
        }
      })
    );

    // Step 5: Remove null/failed ones
    const filtered = predictions.filter(Boolean);

    res.status(200).json(filtered);
  } catch (err) {
    console.error("❌ Error fetching mood predictions:", err.message);
    res.status(500).json({ message: "Failed to fetch mood predictions" });
  }
});


// Inside moodPrediction.js
router.post("/test-analyze", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const { data } = await axios.post("http://localhost:8001/analyze", { text });

    res.json({
      input: text,
      mood: data.mood,
      sentiment: data.sentiment,
      confidence: data.confidence,
    });
  } catch (err) {
    console.error("❌ Test analyze failed:", err.message);
    res.status(500).json({ error: "Mood prediction failed" });
  }
});

router.get("/forecast", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch mood history
    const moodEntries = await MoodEntry.find({ userId }).sort({ createdAt: 1 });

    const formatted = moodEntries.map(entry => ({
      ds: entry.createdAt,
      y: convertToScore(entry.predictedMood || entry.mood) // fallback
    }));

    // 2. Send to ML server
    const { data } = await axios.post("http://localhost:8001/forecast", { history: formatted });

    res.json(data); // expected: { prediction: "calm", confidence: 0.76, reason: "..." }
  } catch (err) {
    console.error("❌ Mood forecast failed:", err.message);
    res.status(500).json({ message: "Mood forecast failed" });
  }
});

export default router;
