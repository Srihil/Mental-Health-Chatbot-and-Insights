import express from "express";
import Journal from "../models/Journal.js";
import verifyToken from "../middleware/verifyToken.js";
import Streak from "../models/Streak.js";

const router = express.Router();

/**
 * ✅ Create a journal entry
 * POST /api/journal/add
 */
// POST /api/journal/add
router.post("/add", verifyToken, async (req, res) => {
  try {
    const { messageId, title, content } = req.body;
    const userId = req.user.id; // ✅ FIXED: Declare this before use

    if (!messageId || !title || !content) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const now = new Date();
    const date = now.toLocaleDateString("en-IN");
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newEntry = new Journal({
      userId,
      messageId,
      title,
      content,
      date,
      time,
    });

    await newEntry.save();

    await Streak.findOneAndUpdate(
      { userId },
      { $inc: { journalCount: 1 } },
      { upsert: true }
    );

    res.status(200).json(newEntry);
  } catch (err) {
    console.error("❌ Journal creation failed:", err.message);
    res.status(500).json({ message: "Failed to create journal entry" });
  }
});



/**
 * ✅ Get all journals by messageId
 * GET /api/journal/:messageId
 */
router.get("/:messageId", verifyToken, async (req, res) => {
  try {
    const journals = await Journal.find({ messageId: req.params.messageId }).sort({ createdAt: -1 });
    res.status(200).json(journals);
  } catch (err) {
    console.error("❌ Failed to fetch journal entries:", err.message);
    res.status(500).json({ message: "Failed to fetch journal entries" });
  }
});
/**
 * ✅ Delete a journal by _id
 * DELETE /api/journal/:id
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // ✅ Fix: Get userId from token
    const deleted = await Journal.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    // Decrease today's journal count only if the deleted journal was from today
    const today = new Date().toISOString().split("T")[0];
    const journalDate = new Date(deleted.createdAt).toISOString().split("T")[0];

    if (journalDate === today) {
      await Streak.findOneAndUpdate(
        { userId },
        { $inc: { journalCount: -1 } },
        { upsert: true }
      );
    }

    res.status(200).json({ message: "Journal entry deleted", id: req.params.id });
  } catch (err) {
    console.error("❌ Failed to delete journal:", err.message);
    res.status(500).json({ message: "Failed to delete journal entry" });
  }
});

// GET /api/insights/mood-trends/:userId
router.get("/mood-trends/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const trends = await MoodEntry.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: { $toDate: "$createdAt" } }, // 1 (Sunday) to 7 (Saturday)
          },
          averageMood: { $avg: "$confidence" }, // Or use your own mood scale
          entries: { $push: "$originalText" },
        },
      },
      {
        $sort: { "_id.day": 1 },
      },
    ]);

    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const formatted = trends.map((t) => ({
      day: dayMap[t._id.day % 7],
      mood: Math.round(t.averageMood * 10), // scale to 1-10
      message: t.entries[0] || "",
    }));

    res.json({ data: formatted });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch mood trends", error: err.message });
  }
});


export default router;
