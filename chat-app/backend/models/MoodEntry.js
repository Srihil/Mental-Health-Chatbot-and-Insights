import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  messageId: { type: String, required: true }, // bot chat ID
  mood: { type: String, required: true },
  sentiment: { type: String, required: true },
  confidence: { type: Number },
  originalText: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("MoodEntry", moodEntrySchema);
