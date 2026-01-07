// routes/memoryRoutes.js
import express from "express";
import Journal from "../models/Journal.js";
import AIMemoryMessage from "../models/AIMemoryMessage.js";
import verifyToken from "../middleware/verifyToken.js";
import axios from "axios";

const router = express.Router();

router.get("/reflective-message/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const [existing, latestJournal] = await Promise.all([
      AIMemoryMessage.findOne({ userId }),
      Journal.findOne({ userId }).sort({ createdAt: -1 }),
    ]);
    
    if (!latestJournal) {
      return res.json({ message: "No journal entries yet. Start writing to reflect!" });
    }

    if (existing && new Date(latestJournal.createdAt) < new Date(existing.updatedAt)) {
      return res.json({ message: existing.message });
    }

    const recentEntries = await Journal.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const journalContents = recentEntries.map((j) => j.content);

    const prompt = `
You're a kind and emotionally intelligent mental health assistant.
Given the user's recent journal reflections, generate one short, encouraging message.
Reference something meaningful from the entries and speak like a trusted friend and make it up to 3 lines.

Journals:
${journalContents.map((e, i) => `- Entry ${i + 1}: ${e}`).join("\n")}
Message:`.trim();

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: "You generate emotionally supportive memory messages from past journals." },
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

    await AIMemoryMessage.findOneAndUpdate(
      { userId },
      { message, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({ message });
  } catch (err) {
    console.error("❌ Reflective memory error:", err.message);
    res.status(500).json({ message: "AI memory message failed. Try again later." });
  }
});

export default router;
