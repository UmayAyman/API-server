import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const mongoURI = "mongodb://127.0.0.1:27017/myDatabase";

const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI);
        console.log("MongoDB Connected Successfully ✅");
    } catch (error) {
        console.error("MongoDB Connection Failed ❌", error);
        process.exit(1);
    }
};

export default connectDB;
