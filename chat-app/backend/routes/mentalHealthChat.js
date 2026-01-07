// routes/mentalHealthChat.js
import express from "express";
import axios   from "axios";
import dotenv  from "dotenv";
import verifyToken from "../middleware/verifyToken.js";

import MoodEntry     from "../models/MoodEntry.js";
import Streak        from "../models/Streak.js";
import MessageThread from "../models/Message.js";
import UserProfile   from "../models/UserProfile.js";

dotenv.config();
const router = express.Router();

router.post("/mental-health-chat", verifyToken, async (req, res) => {
  const { message: userMessage, messageId } = req.body;
  const userId = req.user.id;

  if (!userMessage) {
    return res.status(400).json({ error: "Message is required" });
  }
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  try {
    /* 1️⃣  Load (or create) thread and append the new user turn */
    let thread = await MessageThread.findById(userId);   // no .lean()
    if (!thread) thread = await MessageThread.create({ _id: userId, messages: [] });

    thread.messages.push({
      senderId: userId,
      text: userMessage,
      createdAt: new Date(),
    });
    await thread.save();

    /* 2️⃣  Build last‑15‑turn context */
    const historyTurns = thread.messages.slice(-15).map((m) => ({
      role: m.senderId === userId ? "user" : "assistant",
      content: m.text,
    }));

    /* 3️⃣  Quick mood analysis via micro‑service */
    const moodRes   = await axios.post("http://localhost:8001/analyze", { text: userMessage });
    const moodData  = moodRes.data;

    /* 4️⃣  Fetch user memory */
    const profile = await UserProfile.findOne({ userId }).lean();
    const memoryContext = profile
      ? `
This user has shared:
• Likes: ${profile.likes?.join(", ") || "—"}
• Dislikes: ${profile.dislikes?.join(", ") || "—"}
• Goals: ${profile.goals?.join(", ") || "—"}
`.trim()
      : "No preference data stored yet.";

    /* 5️⃣  Compose system prompt (limit emoji spam) */
    const systemPrompt = `
You are a compassionate mental‑health assistant. Keep replies short (1‑2 calm sentences) and **use at most one emoji total**.
${memoryContext}
`.trim();

    /* 6️⃣  Call OpenRouter (Mistral‑7B Instruct, free) */
    const orRes = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          { role: "system", content: systemPrompt },
          ...historyTurns,
        ],
        max_tokens: 150,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = orRes.data?.choices?.[0]?.message?.content?.trim() ||
                  "I'm here to listen whenever you’d like to share.";

    /* 7️⃣  Save assistant reply (cap thread to 50) */
    await MessageThread.findByIdAndUpdate(
      userId,
      {
        $push: {
          messages: {
            $each: [
              {
                senderId: "assistant",
                text: reply,
                createdAt: new Date(),
              },
            ],
            $slice: -50,
          },
        },
      },
      { new: false }
    );

    /* 8️⃣  Log mood entry + update streak (unchanged) */
    await MoodEntry.create({
      userId,
      messageId,
      mood: moodData.mood,
      sentiment: moodData.sentiment,
      confidence: moodData.confidence,
      originalText: userMessage,
    });

    const today = new Date().toISOString().split("T")[0];
    let streak  = await Streak.findOne({ userId });

    if (!streak) {
      await Streak.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        journalCount: 0,
        reflectionCount: 1,
        calmStreak: moodData.mood === "calm" ? 1 : 0,
        lastCheckInDate: today,
      });
    } else {
      const lastDate   = streak.lastCheckInDate;
      const yesterday  = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const newStreak = lastDate === yesterdayStr ? streak.currentStreak + 1 : 1;

      await Streak.findOneAndUpdate(
        { userId },
        {
          $set: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            calmStreak: moodData.mood === "calm" ? streak.calmStreak + 1 : 0,
            lastCheckInDate: today,
          },
          $inc: { reflectionCount: 1 },
        }
      );
    }

    /* 9️⃣  Send result to client */
    res.json({
      reply,
      mood: moodData.mood,
      sentiment: moodData.sentiment,
      confidence: moodData.confidence,
    });
  } catch (err) {
    console.error("❌ mental-health-chat error:", err);
    res.status(500).json({ error: "Chat failed, please try again." });
  }
});

export default router;
