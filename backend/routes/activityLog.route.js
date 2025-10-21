// routes/activityLog.routes.js
import express from "express";
import { verifyJWT, customRoles } from "../middlewares/auth.middleware.js";

import {
    getMyActivityLogs,
    getAllActivityLogs,
    clearUserLogs,
} from "../controllers/activityLog.controller.js";

const router = express.Router();

// 🔒 Protect all routes
router.use(verifyJWT);

// ✅ User logs
router.route("/my-activity-logs").get(getMyActivityLogs);

// ✅ Admin logs
router.route("/all-activity-logs").get(customRoles("admin"), getAllActivityLogs);

router.route("/clear/:id").delete( clearUserLogs);

export default router;
