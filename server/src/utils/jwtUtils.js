const jwt = require("jsonwebtoken");
const crypto = require("crypto")

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


const cookieOptions = {
    HttpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/api/auth',
    maxAge: 3600000
}


module.exports = {generateAccessToken,generateRefreshToken,hashToken,cookieOptions};

