import express from "express";
import { customRoles, verifyJWT } from "../middlewares/auth.middleware.js";

import { upload } from "../middlewares/multer.middleware.js";
import {
    getAllUsers,
    getOneUser,
    adminUpdateUserProfile,
    adminUpdateUserAvatar,
    adminDeleteUser
} from "../controllers/admin.controller.js";

const router = express.Router()


// *all access
router.route("/users").get(verifyJWT, customRoles("admin"), getAllUsers)
router.route("/user/:id").get(verifyJWT, customRoles("admin"), getOneUser)
    .put(verifyJWT, customRoles("admin"), adminUpdateUserProfile)
    .delete(verifyJWT, customRoles("admin"), adminDeleteUser)


router.route("/user-avatar/:id").put(verifyJWT, customRoles("admin"), upload.single("avatar"), adminUpdateUserAvatar)


export default router;