import mongoose, { Schema } from "mongoose"


const likeSchema = new Schema({
    content:{
        type:String,
        required: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }    
},{timestamps:true})

export const Like = mongoose.model("Comment", likeSchema)