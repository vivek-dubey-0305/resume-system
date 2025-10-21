// models/activityLog.model.js
import mongoose, { Schema } from "mongoose";

const actionSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "upload",
        "delete",
        "download",
        "analytics",
        "update",
        "login",
        "logout",
        "register",
        "reset-password",
        "change-password",
        "update-profile",
        "avatar",
        "delete-user",
       
      ],
    },
    description: { type: String, default: "" },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

const activityLogSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one log doc per user
    },
    activities: [actionSchema], // array of actions
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
