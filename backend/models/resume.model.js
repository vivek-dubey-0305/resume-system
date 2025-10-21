// models/resume.model.js
import mongoose, { Schema } from "mongoose";

const educationSchema = new Schema({
  institution: {
    type: String,
    required: true,
    trim: true
  },
  degree: {
    type: String,
    required: true,
    trim: true
  },
  fieldOfStudy: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  current: {
    type: Boolean,
    default: false
  },
  grade: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationSource: {
    type: String,
    enum: ["manual", "linkedin", "university_api", "other"],
    default: "manual"
  }
});

const experienceSchema = new Schema({
  company: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ["full-time", "part-time", "contract", "internship", "freelance"],
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  current: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verificationSource: {
    type: String,
    enum: ["manual", "company_email", "offer_letter", "linkedin", "other"],
    default: "manual"
  },
  supervisorContact: {
    name: String,
    email: String,
    phone: String
  }
});

const projectSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    // required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  current: {
    type: Boolean,
    default: false
  },
  projectUrl: {
    type: String,
    trim: true
  },
  githubUrl: {
    type: String,
    trim: true
  },
  liveUrl: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verificationMethod: {
    type: String,
    enum: ["manual", "github", "deployment", "code_review", "other"],
    default: "manual"
  }
});

const certificationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  issuingOrganization: {
    type: String,
    required: true,
    trim: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date
  },
  credentialId: {
    type: String,
    trim: true
  },
  credentialUrl: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verificationSource: {
    type: String,
    enum: ["manual", "platform_api", "certificate_file", "other"],
    default: "manual"
  }
});

const skillSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "expert"],
    default: "intermediate"
  },
  category: {
    type: String,
    enum: ["programming", "framework", "tool", "language", "soft-skill", "other"],
    required: true
  },
  yearsOfExperience: {
    type: Number,
    min: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationSource: {
    type: String,
    enum: ["manual", "project", "certification", "work_experience", "test", "other"],
    default: "manual"
  },
  lastUsed: {
    type: Date
  }
});

const hackathonSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    enum: ["devpost", "hackerearth", "codeforces", "leetcode", "other", "custom"],
    default: "other"
  },
  position: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  projectTitle: {
    type: String,
    trim: true
  },
  projectUrl: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  verified: {
    type: Boolean,
    default: false
  },
  verificationSource: {
    type: String,
    enum: ["manual", "platform_api", "certificate", "other"],
    default: "manual"
  }
});

const resumeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    portfolioUrl: String,
    linkedinUrl: String,
    githubUrl: String
  },
  summary: {
    type: String,
    trim: true,
    maxlength: 500
  },
  education: [educationSchema],
  experience: [experienceSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  skills: [skillSchema],
  hackathons: [hackathonSchema],
  languages: [{
    language: String,
    proficiency: {
      type: String,
      enum: ["basic", "intermediate", "fluent", "native"]
    }
  }],
  preferences: {
    template: {
      type: String,
      default: "modern",
      enum: ["modern", "classic", "creative", "minimal", "technical"]
    },
    colorScheme: {
      primary: { type: String, default: "#2563eb" },
      secondary: { type: String, default: "#64748b" }
    },
    fontFamily: {
      type: String,
      default: "inter",
      enum: ["inter", "roboto", "opensans", "lato", "poppins"]
    },
    autoUpdate: {
      type: Boolean,
      default: true
    }
  },
  visibility: {
    type: String,
    enum: ["private", "public", "shared"],
    default: "private"
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true
  },
  lastGenerated: {
    type: Date,
    default: Date.now
  },
  stats: {
    totalVerifiedItems: { type: Number, default: 0 },
    verificationScore: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now }
  }
}, {
  timestamps: true
});

// Indexes for better performance
resumeSchema.index({ "stats.verificationScore": -1 });
resumeSchema.index({ "preferences.autoUpdate": 1 });

// Pre-save middleware to update stats
resumeSchema.pre("save", function (next) {
  this.stats.totalVerifiedItems = 
    this.education.filter(edu => edu.verified).length +
    this.experience.filter(exp => exp.verified).length +
    this.projects.filter(proj => proj.verified).length +
    this.certifications.filter(cert => cert.verified).length +
    this.skills.filter(skill => skill.verified).length +
    this.hackathons.filter(hack => hack.verified).length;

  const totalItems = 
    this.education.length + this.experience.length + this.projects.length +
    this.certifications.length + this.skills.length + this.hackathons.length;

  this.stats.verificationScore = totalItems > 0 
    ? Math.round((this.stats.totalVerifiedItems / totalItems) * 100)
    : 0;

  this.stats.lastUpdated = new Date();
  next();
});

export const Resume = mongoose.model("Resume", resumeSchema);