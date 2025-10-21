const cookieToken = async (user, res) => {

    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken;

    const options = {
        httpOnly: true,
        secure: true,
        maxAge: 3 * 24 * 60 * 60 * 1000,  // 7 days in milliseconds
        sameSite: "Strict"
    }

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json({
            success: true,
            message: `User created`,
            user, accessToken, refreshToken
        })
}

export { cookieToken }