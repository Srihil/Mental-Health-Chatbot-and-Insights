// models/PersonalizedSuggestion.js
import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    date: { type: String, required: true }, // e.g., "2025-07-06"
    suggestions: [
      {
        icon: String,
        title: String,
        description: String,
      },
    ],
  },
  { timestamps: true }
);

const PersonalizedSuggestion =
  mongoose.models.PersonalizedSuggestion ||
  mongoose.model("PersonalizedSuggestion", suggestionSchema);

export default PersonalizedSuggestion;
