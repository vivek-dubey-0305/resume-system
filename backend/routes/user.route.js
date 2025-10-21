import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
    registerUser,
    loginUser,
    logoutUser,
    sendOtpToUser,
    verifyOtpForUser,
    sendResetPasswordLinkToUser,
    resetPassword,
    changeCurrentPassword,
    getLoggedInUserInfo,
    updateUserProfile,
    deleteUser,
    updateUserAvatar
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router()

// *==========================
// *User Routes

// *Register and login routes
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

// *OTP routes
router.route("/send-otp").get(verifyJWT, sendOtpToUser)
router.route("/verify-otp").post(verifyOtpForUser)

// *Forgot password flow
router.route("/password/forgot-password").post(sendResetPasswordLinkToUser)
router.route("/password/forgot-password/:token").post(resetPassword)

// *Authenticated user routes
router.route("/password/update-password").put(verifyJWT, changeCurrentPassword)
router.route("/dashboard").get(verifyJWT, getLoggedInUserInfo)
router.route("/update-profile").put(verifyJWT, updateUserProfile)
router.route("/update-avatar").put(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/delete-profile").delete(verifyJWT, deleteUser)
router.route("/logout").get(verifyJWT, logoutUser)


export default router;