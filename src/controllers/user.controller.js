import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

const loginUser = asyncHandler(async (req,res,next)=>{
  const { username, email, password } = req.body

  if(username=="" || password=="" || email=="")
  {
    throw new ApiError(401, "Invalid credentials")
  }

  const user = await User.findOne(
    {
      $or: [{username}, {email}]
    }
  )

  if(!user)
  {
    throw new ApiError(404, "Invalid credentials")
  }

  const isValidPassword = user.isPasswordCorrect(password,user.password)
  if(!isValidPassword)
  {
    throw new ApiError(401, "Invalid credentials")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user_id).select(
    "-password -refreshToken"
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  res.status(200)
  .cookie('accessToken',accessToken,options)
  .cookie('refreshToken', refreshToken,options)
  .json(
    new ApiResponse(200,{user: loggedInUser, accessToken, refreshToken},"User logged in Successfully")
  )
})

const logoutUser = asyncHandler(async (req,res) =>{
    const user = res.user;
    await User.findByIdAndUpdate(
      req.user._id,
      {
      $set:{refreshToken:undefined}
      },
      {
        new: true
      }
  )

  const options = {
    httpOnly:true,
    secure:true
  }

  res.status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200, {},"User logged Out Successfully"))
})

const generateAccessAndRefreshToken = (userId) =>{
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    user.save()
    return { accessToken , refreshToken }
}

export { 
  registerUser,
  loginUser,
  logoutUser
 };
