import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  return toggleLikeAndGetLikeCount(videoId, "video", req, res);
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  return toggleLikeAndGetLikeCount(commentId, "comment", req, res);
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  return toggleLikeAndGetLikeCount(tweetId, "tweet", req, res);
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: { likedBy: new mongoose.Types.ObjectId(req.user?._id), video: { $exists : true } },
      
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
      },
    },
    {
      $project:{
        likedVideos:1,
        _id:0
      }
    }
  ]);

  if (likedVideos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No videos liked by the user"));
  } else {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          likedVideos,
          "liked videos of the user are fetched successfully"
        )
      );
  }
});

const toggleLikeAndGetLikeCount = async (id, type, req, res) => {
  let model;
  switch (type) {
    case "video":
      model = Video;
      break;
    case "comment":
      model = Comment;
      break;
    case "tweet":
      model = Tweet;
      break;
    default:
      throw new ApiError(400, "invalid type");
      break;
  }

  if (!id) {
    throw new ApiError(400, `${type}Id is mandatory`);
  }

  if (!isValidObjectId(id)) {
    throw new ApiError(400, `${type}Id is invalid`);
  }

  const finalFilter = { likedBy: req.user?._id, [type]: id };

  const typeRecord = await model.findById(id);

  if (!typeRecord) {
    throw new ApiError(404, `Invalid ${type}Id`);
  }

  const like = await Like.findOne(finalFilter);
  let likedCount = 0;
  if (!like) {
    await Like.create(finalFilter);
    likedCount = await Like.countDocuments({ [type]: id });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { likeFlag: 1, likedCount: likedCount },
          type + " is liked by User Successfully"
        )
      );
  } else {
    await Like.findOneAndDelete(finalFilter);
    likedCount = await Like.countDocuments({ [type]: id });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { likeFlag: 0, likedCount: likedCount },
          type + " is disliked by User Successfully"
        )
      );
  }
};

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
