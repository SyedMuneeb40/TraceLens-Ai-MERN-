const jwt = require("jsonwebtoken");
const crypto = require("crypto")

const refreshTokenMaxAge = 2 * 24 * 60 * 60 * 1000;

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
    maxAge: refreshTokenMaxAge
};

const clearCookieOptions = {
    httpOnly: cookieOptions.httpOnly,
    sameSite: cookieOptions.sameSite,
    secure: cookieOptions.secure,
    path: cookieOptions.path
};

const generateAccessToken = (user) => {
    const accessToken = jwt.sign(
        {
            id:user._id,
            role:user.role
        },process.env.ACCESSTOKEN_SECRET,
        {
            expiresIn: `15m`
        }
    );

    return accessToken;
};


const generateRefreshToken = (user) => {
    const refreshToken = jwt.sign(
        {
            id:user._id,
        },process.env.REFRESHTOKEN_SECRET,
        {
            expiresIn: `2d`
        }
    );

    return refreshToken;
};


function hashToken(token){
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    return hashedToken;
}


module.exports = {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    cookieOptions,
    clearCookieOptions
};

