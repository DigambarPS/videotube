import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const userExists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (userExists) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage[0].path
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);
  const coverImage = await uploadToCloudinary(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName: fullName,
    email: email,
    password: password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

const loginUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (username == "" || password == "" || email == "") {
    throw new ApiError(401, "Invalid credentials");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "Invalid credentials");
  }

  const isValidPassword = user.isPasswordCorrect(password, user.password);
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = res.user;
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const renewRefreshAndAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Invalid Refresh Token");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }

  try {
    if (user.refreshToken != incomingRefreshToken) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "User Session Reactivated"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//change password
const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (oldPassword == "" || newPassword == "") {
    throw new ApiError(401, "All fields are required");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(401, "invalid user");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old Password is not correct");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

//update user details
const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (fullName == "" || email == "") {
    throw new ApiError(401, "all fields are required");
  }

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );
  user.fullName = fullName;
  user.email = email;
  user.save({ validateBeforeSave: false });

  return req
    .status(200)
    .json(new ApiResponse(200, user, "User Details updated successfully"));
});

//update avatar image
const updateAvatarImage = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.avatar?.path;

  if (!avatarLocalPath) {
    throw new ApiError(401, "Avatar image is required");
  }

  const avatar = await uploadToCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error while uploading Avatar image to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.secure_url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Avatar image updated successfully"));
});

//update cover image
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverLocalPath = req.file?.avatar?.path;

  if (!coverLocalPath) {
    throw new ApiError(401, "Avatar image is required");
  }

  const coverImage = await uploadToCloudinary(coverLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error while uploading Cover image to cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(201)
    .json(new ApiResponse(200, user, "cover image updated successfully"));
});

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200)
    .json( new ApiResponse(
      200,
      req.user,
      "Current User Fetched Successfully"
    ))
})

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  user.save();
  return { accessToken, refreshToken };
};

const getUserChannelProfile = asyncHandler(async(req,res)=>{
  const { username } = req.params

  if(!username)
  {
    throw new ApiError(400, "Username not found")
  }

  const channel = await User.aggregate([
    {
      $match:{ 
        username : username.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields:{
        subscriberCount: {
          $size: "$subscribers"
        },
        channelSubscribedToCount:{
          $size: "$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if: {$in:[req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project:{
        fullName: 1,
        username: 1,
        email: 1,
        subscriberCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404, "Channel does not exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0], "User Channel fetched Successfully")
  )
})

const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
      {
        $match:{
          _id : new mongoose.Schema.Types.ObjectId(req.user?._id)
        },
        
      },
      {
          $lookup:{
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline:[
              {
                $lookup:{
                    from:"Users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline:[
                      {
                        $project:{
                          fullName: 1,
                          username: 1,
                          avatar: 1
                        }
                      }
                    ]
                }
              }
            ]
          }
      }
    ])

    if(!user)
    {
      throw new ApiError(404, "No watch history")
    }

    return res
    .status(200)
    .json(
      new ApiResponse(200, user.watchHistory[0], "user watch history is fetched successfully")
    )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  renewRefreshAndAccessToken,
  updateUserDetails,
  updateAvatarImage,
  updateCoverImage,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory
};
