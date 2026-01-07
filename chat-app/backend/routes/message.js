import express from "express";
import axios from "axios";
import Message from "../models/Message.js";
import verifyToken from "../middleware/verifyToken.js";
import Chat from "../models/Chat.js";
import MoodEntry from "../models/MoodEntry.js"; // ✅ Mood model

const router = express.Router();

// ✅ Create new message with optional mood check-in
router.post("/:id", verifyToken, async (req, res) => {
  try {
    const { senderId, text, image, mood } = req.body;

    const message = {
      senderId,
      createdAt: Date.now(),
    };

    if (text) message.text = text;
    if (image) message.image = image;

    // ✅ If mood exists (user submitted mood check-in)
    if (mood) {
      // 🔍 Analyze mood via Python microservice
      const analysisRes = await axios.post("http://localhost:8001/analyze", {
        text: `I'm feeling ${mood}`,
      });

      const { mood: detectedMood, sentiment, confidence } = analysisRes.data;

      message.mood = detectedMood;
      message.sentiment = sentiment;
      message.confidence = confidence;

      // ✅ Save mood log
      await MoodEntry.create({
        userId: senderId,
        messageId: req.params.id,
        mood: detectedMood,
        sentiment,
        confidence,
        originalText: `I'm feeling ${mood}`,
        createdAt: Date.now() 
      });
    }

    // ✅ Save to Message collection
    const existing = await Message.findById(req.params.id);
    if (!existing) {
      await Message.create({ _id: req.params.id, messages: [message] });
    } else {
      existing.messages.push(message);
      await existing.save();
    }

    // ✅ Update Chat metadata (lastMessage, updatedAt)
    const parts = req.params.id.split("_");
    const receiverId = parts[0] === senderId ? parts[1] : parts[0];
    const lastMessage = text || "[Image]";
    const updatedAt = Date.now();

    await Chat.findOneAndUpdate(
      { userId: senderId, "chatsData.messageId": req.params.id },
      {
        $set: {
          "chatsData.$.lastMessage": lastMessage,
          "chatsData.$.updatedAt": updatedAt,
        },
      }
    );

    if (receiverId !== "bot") {
      await Chat.findOneAndUpdate(
        { userId: receiverId, "chatsData.messageId": req.params.id },
        {
          $set: {
            "chatsData.$.lastMessage": lastMessage,
            "chatsData.$.updatedAt": updatedAt,
          },
        }
      );
    }

    res.status(200).json({ message: "Message and mood log saved" });
  } catch (err) {
    console.error("❌ Failed to save message or mood:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ Get messages by messageId
router.get("/:id", verifyToken, async (req, res) => {
  try {
    let chat = await Message.findById(req.params.id);

    if (!chat) {
      chat = await Message.create({ _id: req.params.id, messages: [] });
    }

    res.json(chat); // { _id, messages: [...] }
  } catch (err) {
    console.error("❌ Error in GET /message/:id", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
  