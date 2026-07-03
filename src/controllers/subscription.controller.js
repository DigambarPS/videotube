import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId) {
    throw new ApiError(400, "channelId is mandatory");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channelId is invalid");
  }

  const channelCheck = await User.exists({ _id: channelId });

  if (!channelCheck) {
    throw new ApiError(404, "Channel not found");
  }

  const channelSubscription = await Subscription.exists({
    owner: req.user?._id,
    channel: channelId,
  });

  if (channelSubscription) {
    deleteSubscription = await Subscription.deleteOne({
      owner: req.user?._id,
      channel: channelId,
    });

    if (!deleteSubscription) {
      throw new ApiError(
        500,
        "Something went wrong while deleting subscription"
      );
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: 0 },
          "Channel is unsubscribed successfully"
        )
      );
  }

  addSubscription = await Subscription.create({
    owner: req.user?._id,
    channel: channelId,
  });

  if (!addSubscription) {
    throw new ApiError(500, "Something went wrong while adding subscription");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isSubscribed: 1 },
        "Channel is subscribed successfully"
      )
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(401, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channelId is invalid");
  }

  const channelCheck = await User.exists({ _id: channelId });

  if (!channelCheck) {
    throw new ApiError(404, "Channel not found");
  }

  const channelSubscribers = await User.aggregate([
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "subDetails",
            },
          },
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!channelSubscribers) {
    throw new ApiError(500, "Something went wrong while fetching subscribers");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscribers,
        "subscribers fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "subscriberId is required");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "subscriberId is invalid");
  }

  const subscriberCheck = await User.exists({ _id: subscriberId });

  if (!subscriberCheck) {
    throw new ApiError(404, "subscriber not found");
  }

  const getSubscribedChannel = await User.aggregate([
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "owner",
        as: "subscribedTo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "subscribedChannels",
            },
          },
          {
            $project: {
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  if (!getSubscribedChannel) {
    throw new ApiError(
      500,
      "Something went wrong while fetching subscribed channels"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getSubscribedChannel,
        "subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
