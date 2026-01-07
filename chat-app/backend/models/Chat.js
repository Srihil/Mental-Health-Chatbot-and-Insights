import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  userId: String,
  chatsData: Array
});

export default mongoose.model('Chat', chatSchema);
