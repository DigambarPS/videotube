import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  renewRefreshAndAccessToken,
  updateUserDetails,
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
router.route("/change-password").post(JWTVerify, updateUserDetails);
router.route("/update-details").post(JWTVerify, updateUserDetails);
router.route("/update-avatar").post(
  JWTVerify,
  upload.fields({
    name: "avatar",
    maxCount: 1,
  }),
  updateAvatarImage
);

router.route("/update-coverImage").post(
  JWTVerify,
  upload.fields({
    name: "coverImage",
    maxCount: 1,
  }),
  updateCoverImage
);
router.route("/update-coverImage").post(JWTVerify, updateUserDetails);
router.route("/renew-access-token").post(renewRefreshAndAccessToken);

export default router;
