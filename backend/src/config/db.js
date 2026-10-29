import mongoose from "mongoose";

async function connectDB() {
  if (!process.env.MONGODB_URI) {
    return;
  }
  // Reuse existing connection if already connected or connecting (crucial for serverless environments)
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
  }
}

export default connectDB;
