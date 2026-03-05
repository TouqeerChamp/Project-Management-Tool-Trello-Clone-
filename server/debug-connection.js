const mongoose = require('mongoose');
require('dotenv').config();

// Enable mongoose debug mode to get more detailed logs
mongoose.set('debug', true);

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB Atlas with detailed logging...');
    console.log('URI being used:', process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^:]*@/, ':***@') : 'ERROR: MONGODB_URI is not defined!');

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Add more detailed connection options to see topology information
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      // Enable detailed logging
      serverSelectionTimeoutMS: 30000, // 30 seconds
      heartbeatFrequencyMS: 10000, // 10 seconds
    });

    console.log('✅ MongoDB connected successfully');

    // Log topology information after connection
    if (mongoose.connection.readyState === 1) {
      console.log('Connection successful!');
      console.log('Connection readyState:', mongoose.connection.readyState);
      console.log('Hosts:', mongoose.connection.host);
    }
  } catch (err) {
    console.error('❌ Connection Error Detail:', err.message);
    console.error('Full error details:', err);

    // Check if it's a connection error related to whitelisting
    if (err.message.toLowerCase().includes('not allowed') ||
        err.message.toLowerCase().includes('whitelist') ||
        err.message.toLowerCase().includes('access') ||
        err.message.includes('403') ||
        err.message.toLowerCase().includes('econnrefused') ||
        err.message.toLowerCase().includes('failed to connect') ||
        err.message.toLowerCase().includes('could not connect to any servers') ||
        err.message.toLowerCase().includes('replicasetnoprimary')) {
      console.error('💡 This appears to be a whitelist/permission issue with MongoDB Atlas.');
      console.error('💡 SOLUTION: Please add your IP address to the MongoDB Atlas whitelist.');
      console.error('💡 To find your current IP: visit https://whatismyipaddress.com/');
      console.error('💡 To add it: MongoDB Atlas Dashboard > Network Access > Add IP Address');
      console.error('💡 For development, you can temporarily use "Allow Access from Anywhere" (0.0.0.0/0)');
    }

    process.exit(1);
  }
};

connectDB();