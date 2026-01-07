import mongoose from "mongoose";

const aiSummarySchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  summary: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("AISummary", aiSummarySchema);
