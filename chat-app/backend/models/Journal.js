// models/Journal.js
import mongoose from "mongoose";

const journalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Journal =
  mongoose.models.Journal || mongoose.model("Journal", journalSchema);

export default Journal;
