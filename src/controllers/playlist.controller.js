import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async(req, res) => {
    const {name, description} = req.body
    
    if(!name || !description)
    {
        throw new ApiError(401,'title and description is required')
    }

    const playlistCheck = await Playlist.exists({owner:req.user?._id, name:name})

    if(playlistCheck)
    {
        throw new ApiError(401, `Playlist with name ${name} already exists in user's playlist`)
    }

    const playlist = await Playlist.create({name:name,description:description,owner:req.user?._id})

    if(!playlist)
    {
        throw new ApiError(500, 'Something went wrong while creating playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            'Playlist created successfully'
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId)
    {
        throw new ApiError(400, "userId is required")
    }

    if(!isValidObjectId(userId))
    {
        throw new ApiError(400, "userId is invalid")
    }

    const userCheck = await User.exists({_id : userId})

    if(!userCheck)
    {
        throw new ApiError(404, "user is not found")
    }

    const userPlaylists = await Playlist.find({owner:userId})

    if(!userPlaylists)
    {
        throw new ApiError(500, "Something went wrong while fetching playlists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            userPlaylists,
            "User's playlists have been fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId)
    {
        throw new ApiError(400, 'playlistId is required')
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, 'playlistId is invalid')
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist)
    {
        throw new ApiError(403, 'Playlist not found')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            'Playlist fetched successfully'
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId)
    {
        throw new ApiError(400, 'playlistId and videoId are required')
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, 'playlistId is invalid')
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, 'videoId is invalid')
    }

    const videoCheck = await Video.exists({_id:videoId})

    if(!videoCheck)
    {
        throw new ApiError(404, 'video not found')
    }

    const playlistCheck = await Playlist.findById(playlistId)

    if(!playlistCheck)
    {
        throw new ApiError(404, 'Playlist not found')
    }
    
    if(playlistCheck.videos.includes(videoId))
    {
        throw new ApiError(401, 'Video is already present in playlist')
    }

    playlistCheck.videos.push(videoId)

    const playlistNew = await playlistCheck.save()

    if(!playlistNew)
    {
        throw new ApiError(500, 'Something went wrong while adding video to the playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistNew,
            'Video is successfully added to the playlist'
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId)
    {
        throw new ApiError(400, 'playlistId and videoId are required')
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, 'playlistId is invalid')
    }

    if(!isValidObjectId(videoId))
    {
        throw new ApiError(400, 'videoId is invalid')
    }

    const videoCheck = await Video.exists({_id:videoId})

    if(!videoCheck)
    {
        throw new ApiError(404, 'video not found')
    }

    const playlistCheck = await Playlist.findById(playlistId)

    if(!playlistCheck)
    {
        throw new ApiError(404, 'Playlist not found')
    }
    
    if(!playlistCheck.videos.includes(videoId))
    {
        throw new ApiError(404, 'Video is not present in playlist')
    }

    playlistCheck.videos = playlistCheck.videos.filter(id => id.toString() !== videoId)
    const playlistNew = await playlistCheck.save();

    if(!playlistNew)
    {
        throw new ApiError(500, 'Something went wrong while removing video from the playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistNew,
            'Video is removed successfully from the playlist'
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    
    if(!playlistId)
    {
        throw new ApiError(400, 'playlistId is required')
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, 'playlistId is invalid')
    }

    const playlistCheck = await Playlist.findById(playlistId)

    if(!playlistCheck)
    {
        throw new ApiError(404, 'Playlist not found')
    }

    const playlistDelete = await Playlist.findByIdAndDelete(playlistId)

    if(!playlistDelete)
    {
        throw new ApiError(500, 'Some error while deleting playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistDelete,
            'playlist has been deleted successfully'
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!playlistId || !name || !description)
    {
        throw new ApiError(400, 'playlistId , title and description is required')
    }

    if(!isValidObjectId(playlistId))
    {
        throw new ApiError(400, 'playlistId is invalid')
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist)
    {
        throw new ApiError(404, 'Playlist not found')
    }

    const playlistCheck = await Playlist.exists({owner:req.user?._id, name:name})

    if(playlistCheck)
    {
        throw new ApiError(404, `Playlist with ${name} already exists in user's playlists`)
    }

    playlist.name = name
    playlist.description = description

    const playlistUpdated = await playlist.save()

    if(!playlistUpdated)
    {
        throw new ApiError(500, 'Something went wrong while updating playlist')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlistUpdated,
            'Playlist updated successfully'
        )
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}