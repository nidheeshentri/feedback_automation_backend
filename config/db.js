// backend/config/db.js
import mongoose from "mongoose";

export const connectDB = async (MONGO_URI) => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(MONGO_URI, { dbName: "automation" });
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};
