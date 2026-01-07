import mongoose from "mongoose";

const aiMemoryMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  message: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("AIMemoryMessage", aiMemoryMessageSchema);
