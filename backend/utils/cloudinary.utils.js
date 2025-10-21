import { v2 as cloudinary } from "cloudinary"
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { cloudinaryAvatarRefer } from "./constants.utils.js";

// Load environment variables
dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, refer = "", user = null, originalName = "") => {
    try {
        if (!localFilePath) {
            return "No file have uploaded";
        }
        // ✅ build custom filename
        let publicId = path.parse(originalName).name; // default: original file name (without ext)
        if (user?.fullName) {
            const safeName = user.fullName.replace(/\s+/g, "-"); // sanitize spaces
            const ext = path.extname(originalName);  // .png
            publicId = refer === cloudinaryAvatarRefer
                ? `${safeName}-avatar`
                : `${safeName}-file${ext}`;
        }

        // upload file(pdf) on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: refer === cloudinaryAvatarRefer ? "ZIDIO/avatars" : "ZIDIO/files",
            resource_type: refer === cloudinaryAvatarRefer ? "image" : "raw",
            public_id: publicId,    // ✅ custom name
            use_filename: true,     // ✅ keep original filename if no user provided
            unique_filename: false, // ✅ don’t add random hash
            overwrite: true,
        });
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    } finally {
        fs.unlinkSync(localFilePath);
    }
}


const destroyOnCloudinary = async (imageId, refer = "") => {
    try {
        // upload file on cloudinary
        const response = await cloudinary.uploader.destroy(imageId, {
            folder: refer === cloudinaryAvatarRefer ? "ZIDIO/avatars" : "ZIDIO/files",
            resource_type: refer === cloudinaryAvatarRefer ? "image" : "raw",
        });
        return response;

    } catch (error) {
        return null;
    } finally {
        return;
    }
}
export { uploadOnCloudinary, destroyOnCloudinary };