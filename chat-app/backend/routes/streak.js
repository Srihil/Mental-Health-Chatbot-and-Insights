import express from "express";
import Streak from "../models/Streak.js";
import MoodEntry from "../models/MoodEntry.js";
import Journal from "../models/Journal.js";

const router = express.Router();

// ✅ Get current IST date string
const getISTDateString = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().split("T")[0];
};

const isYesterday = (prev, today) => {
  const d1 = new Date(prev);
  const d2 = new Date(today);
  const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  return diff === 1;
};

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const today = getISTDateString();

    let streak = await Streak.findOne({ userId });

    const [todayMoods, todayJournals] = await Promise.all([
      MoodEntry.find({
        userId,
        createdAt: {
          $gte: new Date(`${today}T00:00:00+05:30`),
          $lte: new Date(`${today}T23:59:59.999+05:30`),
        },
      }),
      Journal.find({
        userId,
        createdAt: {
          $gte: new Date(`${today}T00:00:00+05:30`),
          $lte: new Date(`${today}T23:59:59.999+05:30`),
        },
      }),
    ]);

    const hasAnyCheckInToday = todayMoods.length > 0 || todayJournals.length > 0;
    const hasCalmMoodToday = todayMoods.some((m) => m.mood === "calm");

    // 🔰 CREATE new if not exist
    if (!streak) {
      streak = new Streak({
        userId,
        currentStreak: hasAnyCheckInToday ? 1 : 0,
        longestStreak: hasAnyCheckInToday ? 1 : 0,
        calmStreak: hasCalmMoodToday ? 1 : 0,
        journalCount: todayJournals.length,
        reflectionCount: todayMoods.length,
        lastCheckInDate: hasAnyCheckInToday ? today : null,
        lastCalmStreakDate: hasCalmMoodToday ? today : null,
      });
      await streak.save();
      return res.json(streak);
    }

    // 🔁 Update current streak
    if (hasAnyCheckInToday) {
     
    
      if (!streak.lastCheckInDate) {
        streak.currentStreak = 1;
        streak.longestStreak = 1;
        streak.lastCheckInDate = today;
      } else if (streak.lastCheckInDate !== today) {
        if (isYesterday(streak.lastCheckInDate, today)) {
          console.log("➕ Yesterday was previous check-in. Incrementing streak.");
          streak.currentStreak += 1;
        } else {
          streak.currentStreak = 1;
        }
        streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
        streak.lastCheckInDate = today;
      }
    }
    

    // 🧘 Calm streak (only once per day)
    if (hasCalmMoodToday && streak.lastCalmStreakDate !== today) {
      streak.calmStreak += 1;
      streak.lastCalmStreakDate = today;
    } else if (!hasCalmMoodToday && todayMoods.length > 0) {
      // Mood logged but no calm today
      streak.calmStreak = 0;
      streak.lastCalmStreakDate = null;
    }

    // 📆 Always update counts
    streak.journalCount = todayJournals.length;
    streak.reflectionCount = todayMoods.length;

    await streak.save();
    res.json(streak);
  } catch (err) {
    console.error("❌ Error updating streak:", err.message);
    res.status(500).json({ error: "Failed to update streak" });
  }
});

export default router;
