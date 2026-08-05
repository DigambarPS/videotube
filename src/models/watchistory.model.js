import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"

const watchHistorySchema = new Schema(
    {
        video:{
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
)

watchHistorySchema.plugin(mongooseAggregatePaginate)
export const WatchHistory = mongoose.model("watchHistory", watchHistorySchema)