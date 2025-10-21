import { ActivityLog } from "../models/activityLog.model.js";

export const logActivity = async (userId, action, description, req) => {
    try {
        await ActivityLog.findOneAndUpdate(
            { user: userId },
            {
                $push: {
                    activities: {
                        action,
                        description,
                        ipAddress: req.ip,
                        userAgent: req.headers["user-agent"],
                    },
                },
            },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error("Error logging activity:", err.message);
    }
};
