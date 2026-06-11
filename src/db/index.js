import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        console.log(`${process.env.MONGODB_URI}`)
        await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`MONGODB Connected !! DB HOST ${connectionInstance.connection.host}`)
    }catch (error){
        console.log('Error in DB connection:',error)
        process.exit(1)
    }
}

export default connectDB