import mongoose from 'mongoose';

const devDB = "meepletron-dev";
const prodDB = "meepletron";
const dbName = process.env.NODE_ENV !== "production" ? devDB : prodDB;

// Serverless-safe connection cache. Under Vercel Fluid, many invocations share
// (or rapidly recreate) the same worker; caching the connection PROMISE on the
// global object dedupes concurrent connects and reuses a pooled connection
// across invocations instead of reconnecting per request.
let cached = globalThis._mongoose;
if (!cached) {
  cached = globalThis._mongoose = { conn: null, promise: null };
}

const connectToDB = async () => {
  mongoose.set('strictQuery', true);

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName,
        maxPoolSize: 10,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // allow a retry on the next request
    throw new Error("Error in Connecting to Database" + error);
  }

  return cached.conn;
};

export default connectToDB;
