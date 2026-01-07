// routes/suggestionsRoutes.js
import express from "express";
import Journal from "../models/Journal.js";
import PersonalizedSuggestion from "../models/PersonalizedSuggestion.js";
import verifyToken from "../middleware/verifyToken.js";
import axios from "axios";

const router = express.Router();

router.get("/suggestions/:userId", verifyToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date().toISOString().split("T")[0];

    const existing = await PersonalizedSuggestion.findOne({ userId, date: today });
    if (existing?.suggestions?.length) {
      return res.json({ suggestions: existing.suggestions });
    }

    const journals = await Journal.find({ userId }).sort({ createdAt: -1 }).limit(5);
    if (!journals.length) {
      return res.json({ suggestions: [] });
    }

    const journalText = journals.map((j, i) => `Entry ${i + 1}: ${j.content}`).join("\n");

    const prompt = `
You're a supportive mental health assistant.
Based on the following journal reflections, suggest 3 self-care or motivational activities the user can try today.

Each suggestion must include:
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
          { role: "system", content: "You generate JSON-based personalized suggestions from user journals." },
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

    try {
      const match = raw.match(/\[\s*{[\s\S]*}\s*]/);
      suggestions = match ? JSON.parse(match[0]) : [];
    } catch (err) {
      console.error("❌ Failed to parse AI JSON:", raw);
      return res.status(500).json({ suggestions: [] });
    }

    const normalized = suggestions.map((s) => ({
      icon: s.icon ?? "💡",
      title: s.title ?? s.activity ?? "Untitled",
      description: s.description ?? s.reason ?? "No details provided.",
    }));

    if (!Array.isArray(normalized) || normalized.length === 0) {
      return res.json({ suggestions: [] });
    }

    await PersonalizedSuggestion.findOneAndUpdate(
      { userId, date: today },
      { suggestions: normalized },
      { upsert: true }
    );

    return res.json({ suggestions: normalized });
  } catch (err) {
    console.error("❌ Suggestion generation failed:", err.message);
    return res.status(500).json({ suggestions: [] });
  }
});

export default router;
