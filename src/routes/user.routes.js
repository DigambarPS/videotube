import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  renewRefreshAndAccessToken,
  updateUserDetails,
  changeUserPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import JWTVerify from "../middlewares/jwtVerify.middleware.js";

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
router.route("/logout").post(JWTVerify, logoutUser);
router.route("/change-password").post(JWTVerify, changeUserPassword);
router.route("/update-details").patch(JWTVerify, updateUserDetails);
router.route("/update-avatar").patch(
  JWTVerify,
  upload.fields({
    name: "avatar",
    maxCount: 1,
  }),
  updateAvatarImage
);

router.route("/update-coverImage").patch(
  JWTVerify,
  upload.fields({
    name: "coverImage",
    maxCount: 1,
  }),
  updateCoverImage
);
router.route("/update-coverImage").patch(JWTVerify, updateUserDetails);
router.route("/renew-access-token").post(renewRefreshAndAccessToken);
router.route("/get-current-user").get(JWTVerify, getCurrentUser);
router.route("/c/:username").get(JWTVerify, getUserChannelProfile);
router.route("/history").get(JWTVerify, getUserWatchHistory);


export default router;
