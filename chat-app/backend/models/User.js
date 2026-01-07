import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: String,
  password: String,
  name: String,
  avatar: String,
  bio: String,
  lastSeen: Number
});

export default mongoose.model('User', userSchema);
