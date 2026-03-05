const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...\n');
console.log('URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      connectTimeoutMS: 30000,
      family: 4,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });
    
    console.log('\n✅ BOOM! MongoDB Connected Successfully');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);
    
    await mongoose.disconnect();
    console.log('\n✅ Test completed - Connection verified!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Connection Failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);
    process.exit(1);
  }
};

connectDB();
