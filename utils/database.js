import mongoose from 'mongoose';

let isConnected = false; // track the connection

const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if(isConnected) {
    console.log('MongoDB is already connected');
    return;
  }
  const devDB = "meepletron-dev"
  const prodDB = "meepletron"

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.NODE_ENV !="production" ? devDB: prodDB,
    })

    isConnected = true;

    console.log('MongoDB connected')
  } catch (error) {
    throw new Error("Error in Connecting to Database"+ error);
  }
}

export default connectToDB;