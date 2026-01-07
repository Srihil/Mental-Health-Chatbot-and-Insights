import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  _id: String, // This will be the custom ID like "user1_user2"
  messages: [
    {
      senderId: String,
      text: String,
      image: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      // 🔥 Mood analysis fields
      mood: String,
      sentiment: String,
      confidence: Number,
      isCheckIn: Boolean, // optional

    },
  ],
});

export default mongoose.model('Message', messageSchema);
