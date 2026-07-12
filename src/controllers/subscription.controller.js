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

  if (channelId == req.user?._id) {
    throw new ApiError(
      400,
      "invalid action - user cannot subscribe to own channel"
    );
  }

  const channelCheck = await User.exists({ _id: channelId });

  if (!channelCheck) {
    throw new ApiError(404, "Channel not found");
  }

  const channelSubscription = await Subscription.exists({
    subscriber: req.user?._id,
    channel: channelId,
  });

  if (channelSubscription) {
    const deleteSubscription = await Subscription.deleteOne({
      subscriber: req.user?._id,
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

  const addSubscription = await Subscription.create({
    subscriber: req.user?._id,
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
      $match: { _id: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $match: { channel: new mongoose.Types.ObjectId(channelId) },
          },
          {
            $lookup: {
              from: "users",
              localField: "subscriber",
              foreignField: "_id",
              as: "subDetails",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $project: {
        subscribers: 1,
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
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "channelId is required");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channelId is invalid");
  }

  const subscriberCheck = await User.exists({ _id: channelId });

  if (!subscriberCheck) {
    throw new ApiError(404, "subscriber not found");
  }

  const getSubscribedChannel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "channel",
              foreignField: "_id",
              as: "subscribedChannels",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      $project: {
        subscribedTo: 1,
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
