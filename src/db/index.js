import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try{
        // console.log(`${process.env.MONGODB_URI}`)
        let connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI+DB_NAME}`)
        console.log(`MONGODB Connected !! DB HOST ${connectionInstance.connection.host}`)
    }catch (error){
        console.log('Error in DB connection:',error)
        process.exit(1)
    }
}

export default connectDB