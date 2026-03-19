const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const db = process.env.MONGO_DB_CANDIDATES || 'candidatesdb';
  await mongoose.connect(`${uri}/${db}`);
  console.log(`MongoDB connected: ${db}`);
};

module.exports = connectDB;
