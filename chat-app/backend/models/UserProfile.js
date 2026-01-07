import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
    likes: [String],
    dislikes: [String],
    goals: [String],
    recurringMood: String,      // store most‑seen mood or a running stat
    lastUpdated: Date,
  },
  { timestamps: true }
);

export default mongoose.model("UserProfile", userProfileSchema);
