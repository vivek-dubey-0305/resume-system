// controllers/resume.controller.js
import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../middlewares/error.middleware.js";
import { Resume } from "../models/resume.model.js";
import { User } from "../models/user.model.js";
import { logActivity } from "../utils/logActivity.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { integrationService } from "../services/integration.service.js";

// ================== RESUME CRUD OPERATIONS ==================

// Create or Initialize Resume
const createOrInitializeResume = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Check if resume already exists
    let resume = await Resume.findOne({ user: userId });

    if (resume) {
      return res.status(200).json({
        success: true,
        message: "Resume already exists",
        resume
      });
    }

    // Get user data for personal info
    const user = await User.findById(userId).select("fullName email phone social_links");

    // Create new resume with user data
    resume = await Resume.create({
      user: userId,
      personalInfo: {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        linkedinUrl: user.social_links?.website || "",
        githubUrl: user.social_links?.github || "",
        portfolioUrl: user.social_links?.website || ""
      },
      summary: "Experienced professional with strong technical skills and proven track record...",
      preferences: {
        template: "modern",
        colorScheme: { primary: "#2563eb", secondary: "#64748b" },
        fontFamily: "inter",
        autoUpdate: true
      }
    });

    await logActivity(
      userId,
      "create-resume",
      "Initialized new resume profile",
      req
    );

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      resume
    });

  } catch (error) {
    console.error("Error creating resume:", error);
    return next(new ErrorHandler(`Failed to create resume: ${error.message}`, 500));
  }
});

// Get User's Resume
const getMyResume = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const resume = await Resume.findOne({ user: userId })
      .populate("user", "fullName email avatar");

    if (!resume) {
      return next(new ErrorHandler("Resume not found. Please create a resume first.", 404));
    }

    await logActivity(
      userId,
      "view-resume",
      "Viewed their resume",
      req
    );

    res.status(200).json({
      success: true,
      resume
    });

  } catch (error) {
    console.error("Error fetching resume:", error);
    return next(new ErrorHandler(`Failed to fetch resume: ${error.message}`, 500));
  }
});

// Get Resume by Share Token (Public Access)
const getResumeByToken = asyncHandler(async (req, res, next) => {
  const { token } = req.params;

  try {
    const resume = await Resume.findOne({ shareToken: token, visibility: { $in: ["public", "shared"] } })
      .populate("user", "fullName email avatar");

    if (!resume) {
      return next(new ErrorHandler("Resume not found or not publicly accessible", 404));
    }

    // Return limited public information
    const publicResume = {
      personalInfo: resume.personalInfo,
      summary: resume.summary,
      education: resume.education,
      experience: resume.experience,
      projects: resume.projects.filter(proj => proj.verified),
      certifications: resume.certifications.filter(cert => cert.verified),
      skills: resume.skills.filter(skill => skill.verified),
      hackathons: resume.hackathons.filter(hack => hack.verified),
      languages: resume.languages,
      preferences: resume.preferences,
      stats: resume.stats
    };

    res.status(200).json({
      success: true,
      resume: publicResume
    });

  } catch (error) {
    console.error("Error fetching public resume:", error);
    return next(new ErrorHandler(`Failed to fetch resume: ${error.message}`, 500));
  }
});

// Update Resume Sections
const updateResumeSection = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { section } = req.params;
  const { data, action = "update" } = req.body;

  const validSections = [
    "personalInfo", "summary", "education", "experience", 
    "projects", "certifications", "skills", "hackathons", 
    "languages", "preferences"
  ];

  if (!validSections.includes(section)) {
    return next(new ErrorHandler(`Invalid section: ${section}`, 400));
  }

  try {
    let resume = await Resume.findOne({ user: userId });
    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    let updatePayload = {};
    let activityMessage = "";

    switch (action) {
      case "update":
        if (section === "personalInfo" || section === "preferences" || section === "summary") {
          updatePayload = { [section]: data };
        } else {
          // For array sections, replace the entire array
          updatePayload = { [section]: data };
        }
        activityMessage = `Updated ${section} section`;
        break;

      case "add":
        if (Array.isArray(resume[section])) {
          updatePayload = { $push: { [section]: data } };
          activityMessage = `Added item to ${section} section`;
        } else {
          return next(new ErrorHandler(`Cannot add to non-array section: ${section}`, 400));
        }
        break;

      case "remove":
        if (Array.isArray(resume[section]) && data._id) {
          updatePayload = { $pull: { [section]: { _id: data._id } } };
          activityMessage = `Removed item from ${section} section`;
        } else {
          return next(new ErrorHandler("Invalid remove operation", 400));
        }
        break;

      default:
        return next(new ErrorHandler("Invalid action", 400));
    }

    resume = await Resume.findOneAndUpdate(
      { user: userId },
      updatePayload,
      { new: true, runValidators: true }
    );

    await logActivity(userId, "update-resume", activityMessage, req);

    res.status(200).json({
      success: true,
      message: `Resume ${section} section updated successfully`,
      resume
    });

  } catch (error) {
    console.error("Error updating resume section:", error);
    return next(new ErrorHandler(`Failed to update resume: ${error.message}`, 500));
  }
});

// Generate Share Token
const generateShareToken = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { visibility = "shared" } = req.body;

  try {
    const shareToken = crypto.randomBytes(32).toString('hex');

    const resume = await Resume.findOneAndUpdate(
      { user: userId },
      { 
        shareToken,
        visibility,
        lastGenerated: new Date()
      },
      { new: true }
    );

    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    await logActivity(userId, "generate-share-link", "Generated resume share link", req);

    res.status(200).json({
      success: true,
      message: "Share token generated successfully",
      shareToken,
      shareUrl: `${process.env.FRONTEND_URL}/resume/${shareToken}`,
      visibility
    });

  } catch (error) {
    console.error("Error generating share token:", error);
    return next(new ErrorHandler(`Failed to generate share token: ${error.message}`, 500));
  }
});

// Revoke Share Token
const revokeShareToken = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const resume = await Resume.findOneAndUpdate(
      { user: userId },
      { 
        $unset: { shareToken: "" },
        visibility: "private"
      },
      { new: true }
    );

    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    await logActivity(userId, "revoke-share-link", "Revoked resume share link", req);

    res.status(200).json({
      success: true,
      message: "Share token revoked successfully"
    });

  } catch (error) {
    console.error("Error revoking share token:", error);
    return next(new ErrorHandler(`Failed to revoke share token: ${error.message}`, 500));
  }
});

// Delete Resume
const deleteResume = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const resume = await Resume.findOneAndDelete({ user: userId });

    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    await logActivity(userId, "delete-resume", "Deleted resume profile", req);

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting resume:", error);
    return next(new ErrorHandler(`Failed to delete resume: ${error.message}`, 500));
  }
});

// ================== CROSS-PLATFORM INTEGRATION ==================

// Auto-update from External Platforms
// const syncWithPlatforms = asyncHandler(async (req, res, next) => {
//   const userId = req.user._id;
//   const { platforms = [] } = req.body;

//   try {
//     const resume = await Resume.findOne({ user: userId });
//     if (!resume) {
//       return next(new ErrorHandler("Resume not found", 404));
//     }

//     const syncResults = {
//       updated: 0,
//       added: 0,
//       errors: []
//     };

//     // Simulate platform sync (you'll integrate actual APIs here)
//     for (const platform of platforms) {
//       try {
//         switch (platform) {
//           case "linkedin":
//             await syncLinkedInData(resume, userId);
//             syncResults.added += 2; // Example
//             break;
//           case "github":
//             await syncGitHubData(resume, userId);
//             syncResults.added += 1; // Example
//             break;
//           case "coursera":
//             await syncCourseraData(resume, userId);
//             syncResults.updated += 1; // Example
//             break;
//           default:
//             syncResults.errors.push(`Unsupported platform: ${platform}`);
//         }
//       } catch (error) {
//         syncResults.errors.push(`Failed to sync ${platform}: ${error.message}`);
//       }
//     }

//     await resume.save();
//     await logActivity(userId, "platform-sync", `Synced with platforms: ${platforms.join(", ")}`, req);

//     res.status(200).json({
//       success: true,
//       message: "Platform synchronization completed",
//       results: syncResults,
//       resume
//     });

//   } catch (error) {
//     console.error("Error syncing with platforms:", error);
//     return next(new ErrorHandler(`Platform synchronization failed: ${error.message}`, 500));
//   }
// });

// POST /sync/platforms
export const syncWithPlatforms = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { platforms = [], accessTokens = {} } = req.body; 
  // accessTokens = { github: "token", linkedin: "token", coursera: "token" }

  try {
    const resume = await Resume.findOne({ user: userId });
    if (!resume) return next(new ErrorHandler("Resume not found", 404));

    const syncResults = { updated: 0, added: 0, errors: [] };

    for (const platform of platforms) {
      try {
        let result;
        const token = accessTokens[platform]; // platform-specific token

        switch (platform) {
          case "github":
            result = await integrationService.syncGitHubData(req.user, token);
            if (result.success) {
              resume.projects.push(...result.data.projects);
              syncResults.added += result.data.projects.length;
            } else {
              syncResults.errors.push(`GitHub: ${result.error}`);
            }
            break;

          case "linkedin":
            result = await integrationService.syncLinkedInData(req.user, token);
            if (result.success) {
              resume.experience.push(...result.data.experience);
              syncResults.added += result.data.experience.length;
            } else {
              syncResults.errors.push(`LinkedIn: ${result.error}`);
            }
            break;

          case "coursera":
            result = await integrationService.syncCourseraData(req.user, token);
            if (result.success) {
              resume.certifications.push(...result.data.certificates);
              syncResults.added += result.data.certificates.length;
            } else {
              syncResults.errors.push(`Coursera: ${result.error}`);
            }
            break;

          default:
            syncResults.errors.push(`Unsupported platform: ${platform}`);
        }

      } catch (err) {
        syncResults.errors.push(`${platform} sync failed: ${err.message}`);
      }
    }

    await resume.save();
    await logActivity(userId, "platform-sync", `Synced with: ${platforms.join(", ")}`, req);

    res.status(200).json({
      success: true,
      message: "Platform synchronization completed",
      results: syncResults,
      resume,
    });

  } catch (error) {
    console.error("Error syncing with platforms:", error);
    next(new ErrorHandler(`Platform sync failed: ${error.message}`, 500));
  }
});


// Helper functions for platform sync (stubs - implement based on actual APIs)
// const syncLinkedInData = async (resume, userId) => {
//   // Implementation for LinkedIn API integration
//   console.log("Syncing LinkedIn data for user:", userId);
//   // Add actual LinkedIn API calls here
// };

// const syncGitHubData = async (resume, userId) => {
//   // Implementation for GitHub API integration
//   console.log("Syncing GitHub data for user:", userId);
//   // Add actual GitHub API calls here
// };

// const syncCourseraData = async (resume, userId) => {
//   // Implementation for Coursera API integration
//   console.log("Syncing Coursera data for user:", userId);
//   // Add actual Coursera API calls here
// };

// Verify Resume Item
const verifyResumeItem = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { section, itemId, verificationData } = req.body;

  try {
    const resume = await Resume.findOne({ user: userId });
    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    const sectionData = resume[section];
    if (!sectionData) {
      return next(new ErrorHandler(`Invalid section: ${section}`, 400));
    }

    const itemIndex = sectionData.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return next(new ErrorHandler("Item not found in specified section", 404));
    }

    // Update verification status
    sectionData[itemIndex].verified = true;
    sectionData[itemIndex].verificationSource = verificationData.source;
    
    if (verificationData.verifiedBy) {
      sectionData[itemIndex].verifiedBy = verificationData.verifiedBy;
    }
    if (verificationData.verifiedAt) {
      sectionData[itemIndex].verifiedAt = verificationData.verifiedAt;
    }

    await resume.save();
    await logActivity(userId, "verify-item", `Verified ${section} item`, req);

    res.status(200).json({
      success: true,
      message: "Item verified successfully",
      item: sectionData[itemIndex]
    });

  } catch (error) {
    console.error("Error verifying item:", error);
    return next(new ErrorHandler(`Verification failed: ${error.message}`, 500));
  }
});

// Get Resume Statistics
const getResumeStats = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const resume = await Resume.findOne({ user: userId });
    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    const stats = {
      verificationScore: resume.stats.verificationScore,
      totalItems: resume.education.length + resume.experience.length + 
                  resume.projects.length + resume.certifications.length + 
                  resume.skills.length + resume.hackathons.length,
      verifiedItems: resume.stats.totalVerifiedItems,
      sections: {
        education: { total: resume.education.length, verified: resume.education.filter(e => e.verified).length },
        experience: { total: resume.experience.length, verified: resume.experience.filter(e => e.verified).length },
        projects: { total: resume.projects.length, verified: resume.projects.filter(p => p.verified).length },
        certifications: { total: resume.certifications.length, verified: resume.certifications.filter(c => c.verified).length },
        skills: { total: resume.skills.length, verified: resume.skills.filter(s => s.verified).length },
        hackathons: { total: resume.hackathons.length, verified: resume.hackathons.filter(h => h.verified).length }
      },
      lastUpdated: resume.stats.lastUpdated
    };

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("Error fetching resume stats:", error);
    return next(new ErrorHandler(`Failed to fetch statistics: ${error.message}`, 500));
  }
});

// Export Resume in Different Formats
const exportResume = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { format = "pdf" } = req.query;

  try {
    const resume = await Resume.findOne({ user: userId })
      .populate("user", "fullName email avatar");

    if (!resume) {
      return next(new ErrorHandler("Resume not found", 404));
    }

    // Generate export based on format
    let exportData;
    switch (format.toLowerCase()) {
      case "pdf":
        exportData = await generatePDF(resume);
        break;
      case "json":
        exportData = generateJSON(resume);
        break;
      case "text":
        exportData = generateText(resume);
        break;
      default:
        return next(new ErrorHandler(`Unsupported export format: ${format}`, 400));
    }

    await logActivity(userId, "export-resume", `Exported resume as ${format.toUpperCase()}`, req);

    res.set({
      'Content-Type': getContentType(format),
      'Content-Disposition': `attachment; filename="resume-${resume.user.fullName}.${format}"`
    });

    res.send(exportData);

  } catch (error) {
    console.error("Error exporting resume:", error);
    return next(new ErrorHandler(`Export failed: ${error.message}`, 500));
  }
});

// Helper functions for export
const getContentType = (format) => {
  const types = {
    pdf: 'application/pdf',
    json: 'application/json',
    text: 'text/plain'
  };
  return types[format] || 'application/octet-stream';
};

const generatePDF = async (resume) => {
  // Implementation for PDF generation
  // You can use libraries like pdfkit, puppeteer, etc.
  return `PDF content for ${resume.user.fullName}`;
};

const generateJSON = (resume) => {
  return JSON.stringify(resume, null, 2);
};

const generateText = (resume) => {
  let text = `${resume.user.fullName}\n`;
  text += `${resume.personalInfo.email} | ${resume.personalInfo.phone}\n\n`;
  text += `Summary:\n${resume.summary}\n\n`;
  // Add more sections as needed
  return text;
};

export {
  createOrInitializeResume,
  getMyResume,
  getResumeByToken,
  updateResumeSection,
  generateShareToken,
  revokeShareToken,
  deleteResume,
  // syncWithPlatforms,
  verifyResumeItem,
  getResumeStats,
  exportResume
};