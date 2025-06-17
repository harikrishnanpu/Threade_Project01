const mongoose = require('mongoose');

const connectDb = async (MONGODB_URI) => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error(" MongoDB connection failed:", err.message);
  }
};

module.exports = { connectDb };
