import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import ErrorHandler from "../middlewares/error.middleware.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"
import crypto from "crypto"

import { User } from "../models/user.model.js";
import { destroyOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.utils.js";
import mongoose from "mongoose";
import { sendEmail } from "../utils/mail.utils.js";
import { cookieToken } from "../utils/cookie.utils.js";
import { cloudinaryAvatarRefer } from "../utils/constants.utils.js";
import { logActivity } from "../utils/logActivity.js";

// *==================================Email Templates nad Link==============================================
function generateEmailLinkTemplate(Token) {
    return `<!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email Verification</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7;">
                        <div>
                            <h3>
                                <a href="http://localhost:5173/password/reset/${Token}">Click here to reset password</a>
                            </h3>
                        </div>
                    </body>
                </html>`;
}

function generateEmailTemplate(verificationCode, companyName = "Zidio", logoUrl = "") {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #ffffff; color: #333;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
          <tr>
              <td align="center" style="padding: 20px 0;">   
                  <table align="center" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #e5e5e5; border-radius: 8px; background-color: #ffffff; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);">
                      <tr>
                          <td style="padding: 25px; text-align: center; background-color: #f8f8f8; border-bottom: 1px solid #eeeeee;">
                              ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" width="120" style="margin-bottom: 10px;" />` : `<h2>${companyName}</h2>`}
                          </td>
                      </tr>
                      <tr>
                          <td style="padding: 30px; text-align: center;">
                              <h1 style="font-size: 22px; color: #333;">Verify Your Email</h1>
                              <p style="font-size: 16px; color: #666;">Use the code below to verify your email address:</p>
                              <div style="font-size: 28px; font-weight: bold; padding: 12px 24px; border: 2px solid #333; display: inline-block; margin: 15px 0;">
                                  ${verificationCode}
                              </div>
                              <p style="font-size: 14px; color: #777;">If you didn’t request this, ignore this email.</p>
                          </td>
                      </tr>
                      <tr>
                          <td style="padding: 20px; text-align: center; background-color: #f8f8f8; border-top: 1px solid #eeeeee;">
                              <p style="font-size: 12px; color: #999;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                          </td>
                      </tr>
                  </table>
              </td>
          </tr>
      </table>
  </body>
  </html>`;
}
// *========================================================================================================


// *Refresh-Access Token Route
// !watch out
const refreshAccessToken = asyncHandler(async (req, res, next) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!incomingRefreshToken) {
     
        return next(new ErrorHandler("Unauthorises Request", 401))
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id);
       
        if (!user || user.refreshToken !== incomingRefreshToken) {
           
            return next(new ErrorHandler("Invalid or Expired Refresh Token", 401))

        }


        // const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)
        cookieToken(user, res)

    } catch (error) {
        return next(new ErrorHandler(error?.message || "Invalid Refresh Token", 401))
        // throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
})


// *Register Route
const registerUser = asyncHandler(async (req, res, next) => {

    const { fullName, email, phone, password } = req.body;

    const requiredFields = [fullName, email, phone.toString(), password]

    const checkFields = { email, phone }

    if (requiredFields.some((field) => !field || field.trim() === "")) {
        return next(new ErrorHandler("All fields are required", 400))
    }
        if (password.length < 8) {
        return next(new ErrorHandler("Password must be at least 8 characters long", 400));
    }

    const existingUser = await User.findOne({
        $or: Object.entries(checkFields).map(([key, value]) => ({ [key]: value }))
    })


    if (existingUser) {
        const duplicateField = Object.keys(checkFields).find(key => existingUser[key].toString().toLowerCase() === checkFields[key].toString().toLowerCase())
        // return res.status(400).json({
        //     success: false,
        //     message: `User already exist with the same ${duplicateField}: "${checkFields[duplicateField]}"\nPlease try unique one!`,
        //     duplicateField
        // })
        return next(new ErrorHandler(`User already exist with the same ${duplicateField}: "${checkFields[duplicateField]}"\nPlease try unique one!`, 400))
    }

    try {
        const user = await User.create({
            fullName, email, phone, password
        })


        await cookieToken(user, res)





    } catch (error) {
        if (error instanceof mongoose.Error.ValidationError) {
            // Optional: get individual field messages
            Object.values(error.errors).forEach(err => {
                return next(new ErrorHandler(`Field: ${err.path} → ${err.message}`));
            });

        } else {
            return false;
        }
    }

})

// *Login Route
const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

 
    try {
        if (!email || !password) {
            return next(new ErrorHandler("Please fill in all fields", 400));
        }

        const user = await User.findOne({ email })


        if (!user) {
            return next(new ErrorHandler("Invalid Credentials", 401))
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if (!isPasswordValid) {
            return next(new ErrorHandler("Invalid credentials", 400))
        }

        cookieToken(user, res)
    } catch (error) {
        return next(new ErrorHandler(`Something went wrong..details - ${error.message}`, 500))
    }

})

// *Logout Route
const logoutUser = asyncHandler(async (req, res, next) => {
    try {
      
        const userId = req.user._id

        try {
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    // $set: { isVerified: false },
                    $unset: { refreshToken: "" } // ✅ Removes refreshToken field
                },

                {
                    new: true
                }
            )
            await logActivity(
                req.user._id,
                "logout",
                `${user?.fullName} logged-out from excel-analytics-platform: `,
                req
            );
        } catch (error) {
        }

        const options = {
            httpOnly: true,
            secure: true
        }


        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({
                success: true,
                message: "User Logged Out Successfully!",
            })
    } catch (error) {
        return next(new ErrorHandler(`Error logout session :\n${error}`, 400))
    }
})

// *OTP ROUTE
const sendOtpToUser = asyncHandler(async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) {
        return next(new ErrorHandler("You are unauthorised to get otp, please register / login to continue", 400))
    }
    const user = await User.findById(userId)
    if (!user?.email) {
        return next(new ErrorHandler("Please provide email used for account creation!"))
    }

    const OTP = await user.generateVerificationCode()
    await user.save()

    try {
        let email = user?.email

        const message = generateEmailTemplate(OTP);
        const mailResponse = await sendEmail({
            email,
            subject: "YOUR VERIFICATION CODE",
            message
        })
        return res.status(200).json({
            success: true,
            message: `Code sent successfully to ${email}`
        })

    } catch (error) {
        return next(new ErrorHandler(`Unable to send email to ${user.email}\n Error ${error.message || error}`, 400))
    }
})

// *Verify Route

const verifyOtpForUser = asyncHandler(async (req, res, next) => {
    const { email, otp } = req.body;
    if (!email) {
        return next(new ErrorHandler("Enter the email to recive OTP", 400))
    }


    if (!otp) {
        return next(new ErrorHandler(`Please enter OTP sent to you mail: ${email} to verify Email`, 400))
    }

    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler("INVALID Email", 400))
    }


    if (!user.verificationCode || user.verificationCode !== Number(otp)) {
        return next(new ErrorHandler("INVALID OTP", 400))
    }

    if (user.verificationCodeExpire < Date.now()) {
        return next(new ErrorHandler("OTP Expired", 400))
    }

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken;
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;

    await user.save({ validateBeforeSave: false });

    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        sameSite: "Strict"
    }

    const resUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(200).
        cookie("accessToken", accessToken, options)
        .
        cookie("refreshToken", refreshToken, options).
        json({
            success: true,
            message: `${email} verified successfully\nUser Created`,
            user: resUser, accessToken, refreshToken
        })
})


// *Reset Password Link
const sendResetPasswordLinkToUser = asyncHandler(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new ErrorHandler("Please provide the email to sned otp", 400))
    }
    const user = await User.findOne({ email })
    if (!user) {
        return next(new ErrorHandler("Please provide email used for account creation!"))
    }

    const Token = await user.generateResetPasswordLink()
    await user.save()

    try {

        const message = generateEmailLinkTemplate(Token);
        const mailRes = await sendEmail({
            email,
            subject: "YOUR RESET PASSWORD LINK",
            message
        })
        return res.status(200).json({
            success: true,
            message: `Email sent successfully to ${email}`
        })

    } catch (error) {
        return next(new ErrorHandler(`Unable to send email to ${email}\n Error ${error.message || error}`, 400))
        // throw new ErrorHandler("Failed to send verification Code", 500)
    }
})


// *reset Pasword vai link
const resetPassword = asyncHandler(async (req, res, next) => {
    // const {token} = req.query;
    const { password, confirmPassword } = req.body
    const token = req?.params?.token

    const encryptedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex")

    const user = await User.findOne({
        forgotPasswordToken: encryptedToken,
        forgotPasswordTokenExpiry: { $gt: Date.now() }
    })


    if (!user) {
        return next(new ErrorHandler("Invalid link", 400))
    }


    if (!password || !confirmPassword) {

        return next(new ErrorHandler("Enter both fields", 400))
    }
    if (password !== confirmPassword) {


        return next(new ErrorHandler("Password and confirm password do not match", 400))
    }


    if (!user.forgotPasswordToken || user.forgotPasswordToken !== encryptedToken) {
        return next(new ErrorHandler("INVALID Link token", 400))
    }

    if (user.forgotPasswordTokenExpiry < Date.now()) {
        return next(new ErrorHandler("Link Expired", 400))
    }



    user.password = password


    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiry = undefined;

    await user.save({ validateBeforeSave: true });
    await logActivity(
        user?._id,
        "reset-password",
        `${user?.fullName} changed(reset) password `,
        req
    );

    return res.status(200).
        json({
            success: true,
            message: `Password for ${user.fullName} changed!`,
        })
})

// *Change Password
const changeCurrentPassword = asyncHandler(async (req, res, next) => {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return next(new ErrorHandler("All fields are required", 400));
    }

    if (newPassword.length < 8) {
        return next(new ErrorHandler("Password must be at least 8 characters long", 400));
    }


    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);



    if (!isPasswordCorrect) {
        // throw new ApiError(401, "");
        return next(new ErrorHandler("Invalid old password", 401))
    }

    if (newPassword !== confirmPassword) {
        return next(new ErrorHandler("Confirm Password dindn't match the new Password!", 401))
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    await logActivity(
        req.user._id,
        "change-password",
        `${user?.fullName} changed password`,
        req
    );

    return res.status(200).json({
        success: true,
        message: "Password update Successfully!"
    })
})



// *Update Profile User
const updateUserProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user?._id
    const { fullName, email, phone, gender, social_links = {} } = req.body

    const requiredFields = [email, phone]

    const checkFields = { email, phone }

    // *Required Fields_____________________________________________
    if (!fullName || !email || !phone) {
        return next(new ErrorHandler("All Fields are required", 400))
    }


    // *Check for an existing User__________________________________________________
    const existingUser = await User.findOne({
        _id: { $ne: userId }, // Exclude the current user
        $or: Object.entries(checkFields).map(([key, value]) => ({ [key]: value }))
    })

    if (existingUser) {
        const duplicateField = Object.keys(checkFields).find(key => existingUser[key].toString().toLowerCase() === checkFields[key].toString().toLowerCase())
        return res.status(400).json({
            success: false,
            message: `User already exist with the same ${duplicateField}: "${checkFields[duplicateField]}"\nPlease try unique one!`,
            duplicateField
        })
        // return next(new ErrorHandler(`User already exist with the same ${duplicateField}: "${checkFields[duplicateField]}"\nPlease try unique one!`, 400))
    }

    try {
        Object.entries(social_links).forEach(([platform, url]) => {
            if (url) {
                try {
                    // Ensure URL is valid
                    const parsed = new URL(url);

                    // 1. Protocol must be HTTPS
                    if (parsed.protocol !== "https:") {
                        throw new Error(`${platform} link must start with https://`);
                    }

                    // 2. Hostname must contain platform domain (except for website)
                    if (platform !== "website" && !parsed.hostname.includes(`${platform}.com`)) {
                        throw new Error(`${platform} link must be a valid ${platform}.com domain`);
                    }

                } catch (e) {
                    throw new Error(`${platform} link is invalid. Please enter a valid full https link.`);
                }
            }
        });

    } catch (error) {
        return res.status(403).json({
            error: "You must provide full links with http(s) included"
        });
    }




    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullName, email, phone, gender, social_links },
        { new: true, runValidators: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
        return next(new ErrorHandler("User not found", 404));
    }
    await logActivity(
        req.user._id,
        "update-profile",
        ` ${updatedUser?.fullName} updated profile`,
        req
    );

    return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser
    });



})


// *Update Profile User
const updateUserAvatar = asyncHandler(async (req, res, next) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        return next(new ErrorHandler("Avatar File is Missing", 404))
    }

    const user = await User.findById(req?.user?._id);
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    // *Delete the previous file
    // ----------------------------------------------------------------
    const previousAvatar = user.avatar?.public_id;

    if (previousAvatar) {
        const deleteAvatarResponse = await destroyOnCloudinary(previousAvatar, cloudinaryAvatarRefer);
    } else {
        console.log("No previous avatr found")
    }
    // ----------------------------------------------------------------


    // *UPLOADING NEW AVATAR

    const newAvatar = await uploadOnCloudinary(avatarLocalPath, cloudinaryAvatarRefer, req?.user, req?.file?.originalname);

    if (!newAvatar || !newAvatar.url || !newAvatar.public_id) {
        return next(new ErrorHandler("Error while uploading avatar!", 500));
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    "avatar.public_id": newAvatar.public_id,
                    "avatar.secure_url": newAvatar.secure_url,
                },
            },
            { new: true }
        ).select("-password")


        await logActivity(
            req.user._id,
            "avatar",
            `${updatedUser?.fullName} updated avatar `,
            req
        );
        return res
            .status(200)
            .json({
                success: true,
                user: updatedUser,
                message: "Avatar Updated Successfully!"
            })
    } catch (error) {
        const deleteAvatarResponse = await destroyOnCloudinary(newAvatar?.public_id, cloudinaryAvatarRefer);
        return next(new ErrorHandler(`Unable to update user profle\n ${error}`, 401))
    }
})

// *User Info Route
const getLoggedInUserInfo = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken")

    res.status(200).json({
        success: true,
        user
    })
})

// *Delete User
const deleteUser = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.user?._id;

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return next(new ErrorHandler("User Not Found", 404))

        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        await logActivity(
            req.user._id,
            "delete-user",
            `${user?.fullName} delete himself `,
            req
        );
        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        return next(new ErrorHandler("Internal Server Error", 500))
    }
});

// *Exports
export {
    refreshAccessToken,
    registerUser,
    loginUser,
    logoutUser,
    sendOtpToUser,
    verifyOtpForUser,
    sendResetPasswordLinkToUser,
    resetPassword,
    getLoggedInUserInfo,
    changeCurrentPassword,
    updateUserProfile,
    updateUserAvatar,
    deleteUser,
}