import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import booksRouter from './routes/books.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import profileRouter from './routes/profile.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Biblioteca API is running' });
});

// Routes
app.use('/api/books', booksRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/profile', profileRouter);

// Global error handler (must be last)
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3001;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/biblioteca';
  await mongoose.connect(uri);
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(() => {
      console.log('✅ Connected to MongoDB');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err.message);
      process.exit(1);
    });
}

export default app;
