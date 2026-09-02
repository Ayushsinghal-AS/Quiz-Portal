import mongoose from "mongoose";
import { env } from "./env.js";

let isConnected = false;

export const connectDatabase = async (uri = env.MONGODB_URI) => {
  if (isConnected) {
    return mongoose.connection;
  }

  await mongoose.connect(uri);
  isConnected = true;
  return mongoose.connection;
};

export const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
};

