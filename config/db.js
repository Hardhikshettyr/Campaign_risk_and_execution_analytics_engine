const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI supplied via environment variables.
 * The process exits if the initial connection fails, since the API
 * cannot serve any meaningful requests without a database connection.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
