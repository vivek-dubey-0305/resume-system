import multer from "multer";
import fs from "fs";
import path from "path";

// Ensure 'public/temp' folder exists before upload
const ensureUploadPath = () => {
  const uploadPath = path.join(process.cwd(), "public", "temp");

  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log("✅ Created upload directory:", uploadPath);
  }

  return uploadPath;
};

// Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("\n-----------\nMULTER.js\n-----------\n");

    const uploadPath = ensureUploadPath();
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileExt = path.extname(file.originalname) || "";
    const safeFileName = file.fieldname + "-" + uniqueSuffix + fileExt;

    cb(null, safeFileName);
  },
});

// Multer middleware export
export const upload = multer({
  storage,
});
