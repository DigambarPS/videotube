import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  //validation
  if (!videoId) {
    throw new ApiError(404, "videoId is mandatory");
  }

  if (!page || page < 1) {
    throw new ApiError(404, "Page value is mandatory");
  }

  if (!limit) {
    throw new ApiError(404, "Limit value is mandatory");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "invalid videoId");
  }

  const options = {
    page: page,
    limit: limit   
  };
  
  const videoComments = await Video.aggregatePaginate(Video.aggregate([
    {
      $match: {
        _id: videoId,
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "owner",
              as: "commentors",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },            
          },
        ],
      },
    },
  ]),options);

  if(!videoComments)
  {
    throw new ApiError(500, "Something went wrong while fetching comments of video")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, videoComments, "Video comments fetched successfully"))
  
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId) {
    throw new ApiError(400, "videoId is mandatory");
  }

  if (!content) {
    throw new ApiError(400, "content is mandatory");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "videoId is invalid");
  }

  const comment = await Comment.create({
    content: content,
    owner: req.user?._id,
    video: videoId,
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong, comment not stored");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) {
    throw new ApiError(404, "commentId is mandatory");
  }

  if (!content) {
    throw new ApiError(404, "content is mandatory");
  }

  const commentCheck = await Comment.findById(commentId);

  if (!commentCheck) {
    throw new ApiError(400, "commentId is invalid");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: { content: content },
    },
    {
      new: true,
    }
  );

  if (!comment) {
    throw new ApiError(500, "Something went wrong while updating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(404, "commentId is mandatory");
  }

  const commentCheck = await Comment.findById(commentId);

  if (!commentCheck) {
    throw new ApiError(400, "commentId is invalid");
  }

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(500, "Something went wrong while deleting comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
