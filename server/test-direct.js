const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection with Non-SRV URL...\n');

// Using direct host connection instead of SRV to bypass DNS issues
const directURI = 'mongodb://touqeer_admin:Pass1234@cluster0-shard-00-00.7asswrh.mongodb.net:27017,cluster0-shard-00-01.7asswrh.mongodb.net:27017,cluster0-shard-00-02.7asswrh.mongodb.net:27017/trelloDB?ssl=true&replicaSet=atlas-7asswrh-shard-0&authSource=admin&retryWrites=true&w=majority';

console.log('Direct URI (without password):', directURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

const testURI = directURI;

const connectDB = async () => {
  try {
    await mongoose.connect(testURI, {
      connectTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    });

    console.log('\n✅ BOOM! MongoDB Connected Successfully with Direct Connection');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.db.databaseName);

    await mongoose.disconnect();
    console.log('\n✅ Test completed - Direct Connection verified!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Direct Connection Failed:', err.message);
    console.error('Error code:', err.code);
    console.error('Full error:', err);

    // Try with the SRV URL from .env again to confirm error
    console.log('\n--- Trying SRV URL again for comparison ---');
    console.log('SRV URI (without password):', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (srvErr) {
      console.error('\nSRV Connection Error (for comparison):', srvErr.message);
    }

    process.exit(1);
  }
};

connectDB();