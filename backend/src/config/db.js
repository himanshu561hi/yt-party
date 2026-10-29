import mongoose from "mongoose";

async function connectDB() {
  if (!process.env.MONGODB_URI) {
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
