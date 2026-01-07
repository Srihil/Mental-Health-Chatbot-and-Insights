import mongoose from 'mongoose';

const moodPredictionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, required: true },
  moodScore: { type: Number, required: true },
  confidence: { type: Number },
  reason: { type: String },
});

const MoodPrediction = mongoose.model('MoodPrediction', moodPredictionSchema);
export default MoodPrediction;
