import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadToCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  let pageOptions = {
    page : page,
    limit : limit
  }

  let videos = Video.aggregatePaginate(Video.find({isPublished:true}), pageOptions)

  if(!sortBy)
  {
    videos = videos.sort({[sortBy] : sortType === 'asc'? 1 : -1})
  }

  const videoList = await videos
  
  if(!videoList)
  {
    throw new ApiError(500,"Something went wrong while fetching videos")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      videoList,
      "Videos are fetched successfully"
    )
  )
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(401, "title and description are mandatory fields");
  }

  const getLocalVideoPath = req.files[0]?.videoFile[0]?.path;
  const getLocalThumbnailPath = req.files[0]?.thumbnail[0]?.path;

  if (!getLocalVideoPath) {
    throw new ApiError(401, "Videofile is mandatory");
  }

  if (!getLocalThumbnailPath) {
    throw new ApiError(401, "thumbnail is mandatory");
  }

  const videoUpload = await uploadToCloudinary(getLocalVideoPath);

  if (!videoUpload) {
    throw new ApiError(500, "Video upload to cloudinary failed");
  }

  const thumbnailUpload = await uploadToCloudinary(getLocalThumbnailPath);

  if (!thumbnailUpload) {
    throw new ApiError(500, "Thumbnail upload to cloudinary failed");
  }

  const video = Video.create({
    videoFile: videoUpload.secure_url,
    title: title,
    description: description,
    thumbnail: thumbnailUpload.secure_url,
    duration: videoUpload.duration,
    isPublished: true,
    views: 0,
    owner: req.user?._id,
    cl_public_id: videoUpload.public_id
  });

  if (!video) {
    throw new ApiError(500, "Something went wrong creating video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId) {
    throw new ApiError(401, "videoId is mandatory");
  }

  const video = Video.findById(videoId);

  if (!video) {
    throw new ApiError(403, "video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(401, "videoId is mandatory");
  }

  if (!title) {
    throw new ApiError(401, "title is mandatory");
  }

  if (!description) {
    throw new ApiError(401, "description is mandatory");
  }

  const video = await Video.exists({_id : videoId});

  if (!video) {
    throw new ApiError(403, "video not found");
  }

  const thumbnailLocalPath = req.file.thumbnail[0]?.path;

  let thumbnailUpload;
  if (thumbnailLocalPath) {
    thumbnailUpload = await uploadToCloudinary(thumbnailLocalPath);
  }

  if (thumbnailLocalPath && !thumbnailUpload) {
    throw new ApiError(500, "Something went wrong while uploading thumbnail");
  }

  updateVideoOptions = {
    title:title,
    description: description
  }

  if (thumbnailUpload) {
      updateVideoOptions.thumbnail = thumbnailUpload.secure_url
  }

    const videoUpdate = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: updateVideoOptions
      },
      {
        new: true,
      }
    );

  if(!videoUpdate)
  {
    throw new ApiError(500, 'Something error while updating video details')
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        videoUpdate,
        'Video details updated successfully'
    )
  )
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if(!videoId)
  {
    throw new ApiError(401, 'videoId is mandatory')
  }
  
  const videoCheck = await Video.findById(videoId)

  if(!videoCheck)
  {
    throw new ApiError(403, 'Video is not found')
  }

  const videoDelete = await Video.findByIdAndDelete(videoId)

  if(!videoDelete)
  {
    throw new ApiError(500, 'Something went wrong while deleting video')
  }

  const videoCl = await deleteFromCloudinary(videoCheck.cl_public_id,'video')

  if(!videoCl)
  {
    throw new ApiError(500, 'something went wrong while deleting video from cloudinary')
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        {},
        'Video is deleted successfully'
    )
  )

});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  if(!videoId)
  {
    throw new ApiError(401, 'videoId is mandatory')
  }

  const videoCheck = await Video.exists({_id:videoId})

  if(!videoCheck)
  {
    throw new ApiError(404, 'video is not found')
  }

  const video = await Video.findByIdAndUpdate(videoId,
    [{$set:{isPublished: { $not: "$isPublished" }}}],
    {new : true}
  )

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        video,
        'Video publish status toggle successful'
    )
  )
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
