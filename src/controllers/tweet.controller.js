import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const content = req.body

    if(!content)
    {
        throw new ApiError(401, 'content is mandatory')
    }

    const tweet = Tweet.create({
        content:content,
        owner:req.user?._id
    })

    if(!tweet)
    {
        throw new ApiError(500, 'Something went wrong while creating tweet')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            'Tweet is created successfully'
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params

    if(!userId)
    {
        throw new ApiError(401, 'userId is required')
    }

    const user = await User.exists({_id : userId})
    
    if(!user)
    {
        throw new ApiError(404, 'user is not found')
    }

    const userTweets = await Tweet.find({owner:userId})

    if(!userTweets)
    {
        throw new ApiError(500, 'Error while fetching user tweets')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userTweets,
            'User tweets fetched successfully'
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    const { tweetId } = req.params

    if(!content || !tweetId)
    {
        throw new ApiError(401, 'tweetId and content is required')
    }

    const tweetCheck = await Tweet.exists({_id:tweetId})

    if(!tweetCheck)
    {
        throw new ApiError(404, 'Tweet not found')
    }

    const tweetUpdate = Tweet.findByIdAndUpdate(tweetId,
        {
            $set: { content : content }
        },
        {
            new : true
        }
    )

    if(!tweetUpdate)
    {
        throw new ApiError(500, 'Error while updating tweet')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweetUpdate,
            'Tweet updated successfully'
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = body.params

    if(!tweetId)
    {
        throw new ApiError(401, "tweetId is required")
    }

    const tweetCheck = await Tweet.exists({_id:tweetId})

    if(tweetCheck)
    {
        throw new ApiError(404, 'Tweet is not found')
    }

    const tweetDelete = await Tweet.findByIdAndDelete(tweetId)

    if(!tweetDelete)
    {
        throw new ApiError(500, 'Error while deleting tweet')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweetDelete,
            'Tweet is deleted successfully'
        )
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}