import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadToCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    
    if(!title || !description)
    {
        throw new ApiError(401, 'title and description are mandatory fields')
    }

    const getLocalVideoPath = req.files[0]?.videoFile[0]?.path
    const getLocalThumbnailPath = req.files[0]?.thumbnail[0]?.path

    if(!getLocalVideoPath)
    {
        throw new ApiError(401, 'Videofile is mandatory')
    }

    if(!getLocalThumbnailPath)
    {
        throw new ApiError(401, 'thumbnail is mandatory')
    }

    const videoUpload = await uploadToCloudinary(getLocalVideoPath)

    if(!videoUpload)
    {
        throw new ApiError(500, 'Video upload to cloudinary failed')
    }

    const thumbnailUpload = await uploadToCloudinary(getLocalThumbnailPath)

    if(!thumbnailUpload)
    {
        throw new ApiError(500, 'Thumbnail upload to cloudinary failed')
    }

    const video = Video.create({
        videoFile:videoUpload.secure_url,
        title: title,
        description: description,
        thumbnail: thumbnailUpload.secure_url,
        duration: videoUpload.duration,
        isPublished: true,
        views:0,
        owner: req.user?._id
    })

    if(!video)
    {
        throw new ApiError(500, 'Something went wrong creating video')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, 'Video uploaded successfully')
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId)
    {
        throw new ApiError(401, 'videoId is mandatory')
    }

    const video = Video.findById(videoId)

    if(!video)
    {
        throw new ApiError(403, 'video not found')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, 'video fetched successfully')
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if(!videoId)
    {
        throw new ApiError(401, 'videoId is mandatory')
    }

    const video = await Video.countDocuments({_id:videoId})

    if(!video)
    {
        throw new ApiError(403, 'video not found')
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}