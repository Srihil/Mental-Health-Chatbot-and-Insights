import mongoose from "mongoose";

const streakSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCheckInDate: { type: String }, // "YYYY-MM-DD"
  lastCalmStreakDate: { type: String }, // ✅ REQUIRED!
  calmStreak: { type: Number, default: 0 },
  journalCount: { type: Number, default: 0 },
  reflectionCount: { type: Number, default: 0 },
}, { timestamps: true });


const Streak = mongoose.models.Streak || mongoose.model("Streak", streakSchema);
export default Streak;
