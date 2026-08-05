import { isValidObjectId } from "mongoose";
import { WatchHistory } from "../models/watchistory.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoLastWatchedDate = asyncHandler( async (req,res) => {
    const { videoId } = req.params;

    if(!videoId)
    {
        throw new ApiError(401, "videoId is required")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(401, "videoId is invalid")
    }

    const videoExists = await Video.exists({_id:videoId})

    if(!videoExists)
    {
        throw new ApiError(401, "videoId is invalid")
    }

    const getData = await WatchHistory.find({video:videoId, owner:req.user?._id}).sort({ _id: -1 }).limit(1)

    if(!getData)
    {
        throw new ApiError(404, "no watch history found for given videoId")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, getData[0].createdAt, 'Last viewed date is fetched successfully')
    )
})

const addVideoToWatchHistory = asyncHandler( async (req,res) => {
    const { videoId } = req.params;

    if(!videoId)
    {
        throw new ApiError(401, "videoId is required")
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(401, "videoId is invalid")
    }

    const videoExists = await Video.exists({_id:videoId})

    if(!videoExists)
    {
        throw new ApiError(401, "videoId is invalid")
    }

    const getData = await WatchHistory.create({video:videoId, owner:req.user?._id})

    if(!getData)
    {
        throw new ApiError(404, "Something went wrong while creating watch history")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, getData, 'watch history added successfully')
    )
})

const removeWatchHistory = asyncHandler( async (req,res) => {
    const { watchHistoryId } = req.params;

    if(!watchHistoryId)
    {
        throw new ApiError(401, "watchHistoryId is required")
    }

    if(!isValidObjectId(watchHistoryId))
    {
        throw new ApiError(401, "watchHistoryId is invalid")
    }

    const watchHistoryExists = await WatchHistory.exists({_id:watchHistoryId})

    if(!watchHistoryExists)
    {
        throw new ApiError(401, "watchHistoryId is invalid")
    }

    const deleteWatchHistory = await WatchHistory.findByIdAndDelete(watchHistoryId)

    if(!deleteWatchHistory)
    {
        throw new ApiError(404, "Something went wrong while deleting watch history")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deleteWatchHistory, 'watch history deleted successfully')
    )
})

const deleteUserWatchHistory = asyncHandler( async (req,res) => {
    const { userId } = req.params;

    if(!userId)
    {
        throw new ApiError(401, "userId is required")
    }

    if(!isValidObjectId(userId))
    {
        throw new ApiError(401, "userId is invalid")
    }

    const watchHistoryExists = await WatchHistory.exists({owner:userId})

    if(!watchHistoryExists)
    {
        throw new ApiError(401, "watchHistory not found for user")
    }

    const deleteWatchHistory = await WatchHistory.deleteMany({owner:userId})

    if(!deleteWatchHistory)
    {
        throw new ApiError(404, "Something went wrong while deleting watch history for user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deleteWatchHistory, 'watch history deleted successfully for user')
    )
})

export {
    getVideoLastWatchedDate,
    addVideoToWatchHistory,
    removeWatchHistory,
    deleteUserWatchHistory
}