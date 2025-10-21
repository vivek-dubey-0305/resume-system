// controllers/activityLog.controller.js
import { ActivityLog } from "../models/activityLog.model.js";

// ================== USER: GET MY ACTIVITY ==================
export const getMyActivityLogs = async (req, res) => {
    try {
        const log = await ActivityLog.findOne({ user: req.user._id })
            .populate("user", "fullName email role");

        if (!log) {
            return res.status(404).json({ message: "No activity logs found for this user" });
        }

        // Return last 50 actions (latest first)
        const recentActivities = log.activities
            .slice(-50) // last 50
            .reverse(); // show newest first

        res.status(200).json({ activities: recentActivities });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================== ADMIN: GET ALL ACTIVITY ==================
export const getAllActivityLogs = async (req, res) => {
    try {
        const { userId, action } = req.query;

        let filter = {};
        if (userId) filter.user = userId;

        let logs = await ActivityLog.find(filter)
            .populate("user", "fullName email role");

        // Optional: filter activities by action
        if (action) {
            logs = logs.map((log) => ({
                ...log.toObject(),
                activities: log.activities.filter((a) => a.action === action),
            }));
        }

        res.status(200).json({ logs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================== ADMIN: CLEAR USER LOGS ==================
export const clearUserLogs = async (req, res) => {
    try {
        const { id } = req.params; // userId

        const log = await ActivityLog.findOne({ user: id });
        if (!log) {
            return res.status(404).json({ message: "No logs found for this user" });
        }

        log.activities = []; // clear the array
        await log.save();

        res.status(200).json({
            message: `Activity logs for user ${id} cleared successfully`,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
