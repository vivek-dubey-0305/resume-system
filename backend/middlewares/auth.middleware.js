import ErrorHandler from "./error.middleware.js";
import { asyncHandler } from "./asyncHandler.middleware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";


export const verifyJWT = asyncHandler(async (req, res, next) => {
    console.log("\n-------------\nVERFYJWT.js\n-------------\n")
    try {
        if (typeof window !== 'undefined') {
            // console.log('we are running on the client')
        } else {
            // console.log('we are running on the server');
            // console.log("req..", req.body)
        }
        // console.log(req.cookies?.accessToken)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        // console.log("token: (12)", token)

        if (!token) {
            // throw new ApiError(401, "Unauthorized Access");
            // return new ApiError(401, "Unauthorized Access (token) - 16)").toResponse(res);
            // console.error("refreshing token expired")
            return next(new ErrorHandler("Unauthorizes!, token expired", 401))

        }

        try {
            const decodedTokenInformation = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            // console.log("decodedTokenInformation: (19)", decodedTokenInformation)

            const user = await User.findById(decodedTokenInformation?._id).select("-password -refreshToken");
            // console.log("user: (22)", user)

            if (!user) {
                // throw new ApiError(401, "Invalid AccessToken!!");
                // return new ApiError(401, "Invalid AccessToken!!");
                // console.error("refreshing user not found, token expired")
                return next(new ErrorHandler("Invalid AccessToken!!, token expired", 401))
            }

            req.user = user;
            // console.log("req.user: (29)", req.user)

            // **Attach `exp` (expiry time) to response headers**
            // res.locals.tokenExp = decodedTokenInformation.exp; // Store expiry timestamp


            next();
        } catch (error) {
            return next(new ErrorHandler("Invalid AccessToken!!, token expired", 401))
        }

    } catch (error) {
        console.log("Access Token Expired! Attempting Refresh...");
        return next(new ErrorHandler("ccess Token Expired!", 401))

        // return refreshAccessToken(req, res, next);
        // return next(new ErrorHandler("Invalid Token!", 401))

    }
})


export const customRoles = (...roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!roles.includes(req.user?.role)) {
            return next(new ErrorHandler("You are not allowed for this action!!", 403))
        }
        next();
    })
}