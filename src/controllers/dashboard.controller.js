import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  if (!req.user?._id) {
    throw new ApiError(404, "Channel Not Found");
  }

  let allStats = await User.aggregate([
    {
      $match: {
        _id: req.user?._id,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: "$likes",
              },
            },
          },
          {
            $project: {
              likesCount: 1,
              views:1
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelSubscribedToCount: {
          $size: "$subscribedTo",
        },
        channelViewsCount: {
          $sum: "$videos.views",
        },
        channelVideosLikesCount: {
          $sum: "$videos.likesCount",
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        channelViewsCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        channelVideosLikesCount:1
      },
    },
  ]);

  if (!allStats) {
    throw new ApiError(404, "No videos found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, allStats, "All stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  if (!req.user?._id) {
    throw new ApiError(404, "Channel Not Found");
  }

  let allVideos = await Video.find({ owner: req.user._id });

  if (!allVideos) {
    throw new ApiError(404, "No videos found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, allVideos, "All videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
