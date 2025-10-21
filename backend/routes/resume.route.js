// routes/resume.routes.js
import express from "express";
import {
  createOrInitializeResume,
  getMyResume,
  getResumeByToken,
  updateResumeSection,
  generateShareToken,
  revokeShareToken,
  deleteResume,
  syncWithPlatforms,
  verifyResumeItem,
  getResumeStats,
  exportResume
} from "../controllers/resume.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/public/:token", getResumeByToken);

// Protected routes
router.use(verifyJWT);

// Basic CRUD operations
router.post("/initialize", createOrInitializeResume);
router.get("/my-resume", getMyResume);
router.delete("/delete", deleteResume);

// Section management
router.patch("/section/:section", updateResumeSection);

// Sharing and visibility
router.post("/share/generate", generateShareToken);
router.post("/share/revoke", revokeShareToken);

// Platform integration
router.post("/sync/platforms", syncWithPlatforms);

// Verification
router.post("/verify", verifyResumeItem);

// Analytics and exports
router.get("/stats", getResumeStats);
router.get("/export", exportResume);

export default router;