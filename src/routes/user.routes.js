import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  renewRefreshAndAccessToken,
  updateUserDetails,
  changeUserPassword,
  getCurrentUser,
  updateAvatarImage,
  updateCoverImage,
  getUserChannelProfile,
  getUserWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeUserPassword);
router.route("/update-details").patch(verifyJWT, updateUserDetails);
router.route("/update-avatar").patch(
  verifyJWT,
  upload.fields([{
      name: "avatar",
      maxCount: 1,
  }]),
  updateAvatarImage
);

router.route("/update-coverImage").patch(
  verifyJWT,
  upload.fields([{
    name: "coverImage",
    maxCount: 1,
  }]),
  updateCoverImage
);
router.route("/renew-access-token").post(renewRefreshAndAccessToken);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getUserWatchHistory);


export default router;
