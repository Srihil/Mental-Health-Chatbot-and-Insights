import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import MoodEntry from '../models/MoodEntry.js';

const router = express.Router();

// 🔍 Mood trends per day (✅ Already Correct with IST)
router.get('/mood-trends/:messageId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const moodEntries = await MoodEntry.aggregate([
      {
        $match: {
          userId,
          messageId,
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d %H:%M:%S',
                date: '$createdAt',
                timezone: 'Asia/Kolkata', // ✅ IST Support
              },
            },
            mood: '$mood',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          moods: {
            $push: {
              mood: '$_id.mood',
              count: '$count',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ moodEntries });
  } catch (err) {
    console.error('❌ Mood trends error:', err);
    res.status(500).json({ message: 'Failed to fetch mood trends' });
  }
});

// 🕰️ Recent 5 Unique Emotions (✅ IST-correct timestamp + sort fix)
router.get("/recent-emotions/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const entries = await MoodEntry.find({ userId, messageId })
      .sort({ createdAt: -1 });

    const seen = new Set();
    const uniqueEmotions = [];

    for (let entry of entries) {
      const mood = entry.mood.toLowerCase();
      if (!seen.has(mood) && uniqueEmotions.length < 5) {
        seen.add(mood);
        uniqueEmotions.push({
          mood,
          sentiment: entry.sentiment,
          timestamp: new Date(
            new Date(entry.createdAt).toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          ), // ✅ timestamp now reflects IST
        });
      }
    }

    res.json(uniqueEmotions);
  } catch (err) {
    console.error("❌ Recent emotions error:", err);
    res.status(500).json({ message: "Failed to get recent emotions" });
  }
});

// 💡 Activity suggestions based on most recent mood (✅ no change needed)
const activitySuggestions = {
  happy: [{ icon: "🎉", activity: "Celebrate small wins", reason: "Boost your morale" }],
  sad: [{ icon: "📖", activity: "Read uplifting quotes", reason: "Shift perspective" }],
  calm: [{ icon: "🧘", activity: "Try breathing exercises", reason: "Stay balanced" }],
  anxious: [{ icon: "🌿", activity: "Go into nature", reason: "Find peace outdoors" }],
  bored: [{ icon: "🎨", activity: "Try doodling", reason: "Engage creatively" }],
  neutral: [{ icon: "📺", activity: "Watch a light show", reason: "Distract gently" }],
};

router.get("/suggestions/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const moods = await MoodEntry.find({ userId, messageId })
      .sort({ createdAt: -1 })
      .limit(10);

    const mood = moods[0]?.mood?.toLowerCase() || "neutral";
    const suggestions = activitySuggestions[mood] || activitySuggestions["neutral"];

    res.json(suggestions);
  } catch (err) {
    console.error("❌ Suggestions error:", err);
    res.status(500).json({ message: "Suggestion fetch failed" });
  }
});

router.get("/moods/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const entries = await MoodEntry.find({ userId, messageId });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch mood entries" });
  }
});
export default router;
