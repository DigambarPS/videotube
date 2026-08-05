import { Router } from 'express';
import {
    getVideoLastWatchedDate,
    addVideoToWatchHistory,
    removeWatchHistory,
    deleteUserWatchHistory
} from "../controllers/watchhistory.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/v/:videoId")
    .get(getVideoLastWatchedDate)
    .post(addVideoToWatchHistory)

router.route("/w/:watchHistoryId").delete(removeWatchHistory);

router.route("/u/:userId")
    .delete(deleteUserWatchHistory);

export default router