import mongoose from 'mongoose';

let isConnected = false;

export default async function connectDB(): Promise<void> {
  // Already connected and connection is alive
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  // Reset flag if connection was lost
  isConnected = false;

  await mongoose.connect(uri, {
    bufferCommands: false, // Fail fast instead of hanging when not connected
    maxPoolSize: 5, // Lambda serves one request at a time, keep pool small
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000, // Fail fast if can't reach MongoDB
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000, // Detect stale connections sooner
  });

  isConnected = true;
  console.log('Connected to MongoDB');
}
