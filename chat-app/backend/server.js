import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import upload from './middleware/upload.js';

import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';
import messageRoutes from './routes/message.js';
import mentalHealthChat from './routes/mentalHealthChat.js';
import insightsRoute from './routes/insights.js';
import journalRoutes from "./routes/journal.js";
import insightsSummaryRoutes from "./routes/insightsSummary.js";
import streakRoutes from './routes/streak.js';
import moodPredictionRoutes from "./routes/mood_prediction.js";
import emotionalJournalRoutes from "./routes/Emotional_Journey.js";
import emotionStabilityRoute  from "./routes/emotionStability.js";
import preferenceRoutes from "./routes/preferences.js";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use("/api/insights", insightsSummaryRoutes);
app.use('/api/insights', insightsRoute);
app.use("/api/insights", emotionalJournalRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/streak", streakRoutes); 
app.use("/api/emotion-stability", emotionStabilityRoute); 
app.use("/api/preferences", preferenceRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', mentalHealthChat); 
app.use("/api/mood", moodPredictionRoutes);

app.use('/api/message', messageRoutes);

// ✅ Dev/testing route
app.post('/dev/test-upload', upload.single('avatar'), (req, res) => {
  console.log('req.file:', req.file);
  res.json({ file: req.file });
});

// ✅ Optional fallback for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ✅ Connect DB and start server
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected');
  app.listen(5000, () => console.log('🚀 Server running on http://localhost:5000'));
})
.catch(err => console.error('❌ DB Connection Error:', err));
