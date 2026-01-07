// backend/routes/insightsSummary.js

import express from "express";
import MoodEntry from "../models/MoodEntry.js";
import Journal from "../models/Journal.js";
import verifyToken from "../middleware/verifyToken.js";
import AIMemoryMessage from "../models/AIMemoryMessage.js";
import PersonalizedSuggestion from "../models/PersonalizedSuggestion.js";
import AISummary from "../models/AISummary.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 📊 AI Mood Summary Generator (cached per latest mood)
router.get("/summary/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    const [existing, latestMood] = await Promise.all([
      AISummary.findOne({ userId }),
      MoodEntry.findOne({ userId }).sort({ createdAt: -1 }),
    ]);

    if (!latestMood) {
      return res.json({
        summary:
          "No mood data available yet. Start journaling to get insights!",
      });
    }

    // 🛑 Use cached if latest mood is older than summary
    if (
      existing &&
      new Date(latestMood.createdAt) < new Date(existing.updatedAt)
    ) {
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

    const moodStats = Object.entries(moodCount)
      .map(([m, c]) => `${m}: ${c}`)
      .join(", ");
    const timeStats = Object.entries(timeBuckets)
      .map(([t, c]) => `${t}: ${c}`)
      .join(", ");

    const prompt = `
You're a mental health assistant summarizing user emotion trends.

Mood summary:
- Emotions: ${moodStats}
- Time pattern: ${timeStats}

Write a short, concise summary (max 2 sentences). Suggest 1 self-care tip.
`.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You generate short, supportive mood summaries for mental health users.",
          },
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

// 🧠 AI Supportive Memory Generator (cached per latest journal)
router.get("/reflective-message/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch latest cached AI message + latest journal entry
    const [existing, latestJournal] = await Promise.all([
      AIMemoryMessage.findOne({ userId }),
      Journal.findOne({ userId }).sort({ createdAt: -1 }),
    ]);

    // If no journal at all, fallback
    if (!latestJournal) {
      return res.json({
        message: "No journal entries yet. Start writing to reflect!",
      });
    }

    // ✅ Use cached message if journal is older than AI message
    if (
      existing &&
      new Date(latestJournal.createdAt) < new Date(existing.updatedAt)
    ) {
      return res.json({ message: existing.message });
    }

    // Fetch last 5 journal entries
    const recentEntries = await Journal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const journalContents = recentEntries.map((j) => j.content);

    // Build prompt for AI
    const prompt = `
You're a kind and emotionally intelligent mental health assistant.
Given the user's recent journal reflections, generate one short, encouraging message.
Reference something meaningful from the entries and speak like a trusted friend and make it upto 3 lines at max.

Journals:
${journalContents.map((e, i) => `- Entry ${i + 1}: ${e}`).join("\n")}

Message:`.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You generate emotionally supportive memory messages from past journals.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const message = response.data.choices?.[0]?.message?.content?.trim();

    // Save to DB (upsert)
    await AIMemoryMessage.findOneAndUpdate(
      { userId },
      { message, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ message });
  } catch (err) {
    console.error("❌ Reflective memory error:", err.message);
    res
      .status(500)
      .json({ message: "AI memory message failed. Try again later." });
  }
});

// 📌 AI-Powered Personalized Suggestions (per day)
router.get("/personalized-suggestions/:userId", verifyToken, async (req, res) => {

  try {
    const userId = req.params.userId;
    const today = new Date().toISOString().split("T")[0];


    // OPTIONAL: Temporarily skip cache to force fresh AI suggestions
    const existing = await PersonalizedSuggestion.findOne({ userId, date: today });
    if (existing?.suggestions?.length) {
      return res.json({ suggestions: existing.suggestions });
    }

    // Fetch journal entries
    const journals = await Journal.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

      if (!journals.length) {
        console.log("⚠️ No journals found for suggestions for", userId);
        return res.json({ suggestions: [] });
      }
      

    const journalText = journals
      .map((j, i) => `Entry ${i + 1}: ${j.content}`)
      .join("\n");

    const prompt = `
You're a supportive mental health assistant.
Based on the following journal reflections, suggest 3 self-care or motivational activities the user can try today.

Each suggestion must include these exact keys:
- "icon" (emoji)
- "title" (short activity name)
- "description" (encouraging sentence)

Respond ONLY with a JSON array. No explanation.

Journals:
${journalText}
    `.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content:
              "You generate JSON-based personalized suggestions from user journals.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.choices?.[0]?.message?.content || "[]";
    let suggestions;

    // Try to parse valid JSON array from AI response
    try {
      const match = raw.match(/\[\s*{[\s\S]*}\s*]/);
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch (err) {
      console.error("❌ Failed to parse AI JSON:", raw);
      return res.status(500).json({ suggestions: [] });
    }

    // ✅ Normalize keys (handle activity/reason fallbacks)
    const normalized = suggestions.map((s) => ({
      icon: s.icon ?? "💡",
      title: s.title ?? s.activity ?? "Untitled",
      description: s.description ?? s.reason ?? "No details provided.",
    }));

    if (!Array.isArray(normalized) || normalized.length === 0) {
      console.warn("⚠️ AI returned invalid or empty suggestions");
      return res.json({ suggestions: [] });
    }

    // ✅ Save normalized version to DB
    await PersonalizedSuggestion.findOneAndUpdate(
      { userId, date: today },
      { suggestions: normalized },
      { upsert: true }
    );

    console.log("✅ Final normalized suggestions:", normalized);
    return res.json({ suggestions: normalized });
  } catch (err) {
    console.error("❌ Suggestion generation failed:", err.message);
    console.error("👉 Error stack:", err.stack);
    return res.status(500).json({ suggestions: [], error: err.message });
  }
  
});



export default router;
