const mongoose = require('mongoose');

const connectDb = async (MONGODB_URI) => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.log(" MongoDB connection failed:", err.message);
  }
};

module.exports = { connectDb };
