const User = require("../models/User.js")
const Session = require("../models/Session.js")
const mongoose = require("mongoose");
const {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    cookieOptions,
    clearCookieOptions
} = require("../utils/jwtUtils.js");
const  createAuditLog  = require("../service/auditLog.service.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const OTP = require("../models/Otp.js");
const { sendOTPEmailAPI: sendOTPEmail } = require("../utils/mailerBrevoApi.js");

const REGISTRATION_OTP = "REGISTRATION";
const PASSWORD_UPDATE_OTP = "PASSWORD_UPDATE";

const sendOtp = async (email, purpose) => {
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
    await OTP.deleteMany({ email, purpose });
    await OTP.create({ email, otp, purpose });
    try {
        await sendOTPEmail(email, otp);
    } catch (error) {
        await OTP.deleteMany({ email, purpose, otp });
        throw error;
    }
};

const getValidOtp = async (email, otp, purpose) => {
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) return null;
    return OTP.findOneAndDelete({ email, otp, purpose }).sort({ createdAt: -1 });
};


const login = async (req,res)=>{
    try{
        const {email , password} = req.body;
        const normalizedEmail = typeof email === "string"
            ? email.trim().toLowerCase()
            : "";

        if(!normalizedEmail || typeof password !== "string" || !password){
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne(
            {
                email: normalizedEmail
            }
        ).select("+password");
        

        if(!user){
            console.warn("[auth] Login lookup failed", {
                emailProvided: true,
                emailFormatValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
            });
            return res.status(404).json({success: false, message:"User Not Found"})
        }

        const isMatched = await bcrypt.compare(password,user.password);
        if(!isMatched){
            return res.status(401).json({success: false, message:"Email/Password is Incorrect"})
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        const hashRefreshToken = hashToken(refreshToken);
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        const session = await Session.create({
            user: user._id,
            refreshTokenHash: hashRefreshToken,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        res.cookie('refreshToken',refreshToken,cookieOptions);

        return res.status(200).json({success: true,message:"Successfully Login",user:userWithoutPassword,accessToken:accessToken});
        
    }catch(error){
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


const register = async (req,res)=>{
    try{
        const {username, email, password} = req.body;
        const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!normalizedUsername || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== "string" || !password) {
            return res.status(400).json({success:false,message:"Username, valid email, and password are required"});
        }

        const alreadyRegisterUser = await User.findOne(
            {
                $or:
                [
                    {username:normalizedUsername},
                    {email:normalizedEmail}
                ]
            }
        );

        if(alreadyRegisterUser){
            return res.status(409).json({success: false, message:"User Already Exists"})
        }
        
        await sendOtp(normalizedEmail, REGISTRATION_OTP);
        return res.status(200).json({success:true,message:"Verification code sent to your email",email:normalizedEmail});

    }catch(error){
        console.error("Registration OTP request failed:", error.message);
        return res.status(500).json({ success: false, message: "Unable to send verification code" });
    }
};

const verifyRegistration = async (req,res)=>{
    try{
        const {username, email, password, otp} = req.body;
        const normalizedUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        if (!normalizedUsername || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== "string" || !password) {
            return res.status(400).json({success:false,message:"Registration details and verification code are required"});
        }

        const validOtp = await getValidOtp(normalizedEmail, otp, REGISTRATION_OTP);
        if (!validOtp) return res.status(400).json({success:false,message:"Verification code is invalid or expired"});

        const alreadyRegisterUser = await User.findOne({$or:[{username:normalizedUsername},{email:normalizedEmail}]});
        if (alreadyRegisterUser) return res.status(409).json({success:false,message:"User Already Exists"});

        const newUser = await User.create({username:normalizedUsername,email:normalizedEmail,password});
        const userWithoutPassword = newUser.toObject();
        delete userWithoutPassword.password;
        return res.status(201).json({success:true,message:"User Successfully Registered",user:userWithoutPassword});
    }catch(error){
        console.error("Registration verification failed:", error.message);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const requestPasswordOtp = async (req,res)=>{
    try{
        const currentPassword = req.body.currentPassword;
        if (typeof currentPassword !== "string" || !currentPassword) {
            return res.status(400).json({success:false,message:"Current password is required"});
        }

        const user = await User.findById(req.user.id).select("+password");
        if (!user) return res.status(404).json({success:false,message:"User Not Found"});
        if (!await bcrypt.compare(currentPassword,user.password)) {
            return res.status(401).json({success:false,message:"Current password is incorrect"});
        }

        await sendOtp(user.email, PASSWORD_UPDATE_OTP);
        return res.status(200).json({success:true,message:"Verification code sent to your account email"});
    }catch(error){
        console.error("Password update OTP request failed:", error.message);
        return res.status(500).json({success:false,message:"Unable to send verification code"});
    }
};

const verifyPasswordUpdate = async (req,res)=>{
    try{
        const {otp,newPassword} = req.body;
        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return res.status(400).json({success:false,message:"New password must be at least 6 characters"});
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({success:false,message:"User Not Found"});
        const validOtp = await getValidOtp(user.email, otp, PASSWORD_UPDATE_OTP);
        if (!validOtp) return res.status(400).json({success:false,message:"Verification code is invalid or expired"});

        user.password = newPassword;
        await user.save();
        await Session.updateMany({user:user._id,revoked:false},{$set:{revoked:true}});
        res.clearCookie("refreshToken",clearCookieOptions);
        return res.status(200).json({success:true,message:"Password changed successfully. Please login again"});
    }catch(error){
        console.error("Password update verification failed:", error.message);
        return res.status(500).json({success:false,message:"Unable to update password"});
    }
};


const logout = async (req,res)=>{
    try{
        const user_id = req.user.id;
        if(!mongoose.Types.ObjectId.isValid(user_id) || !user_id){
            return res.status(400).json({ success: false, message: "User ID is invalid/Empty" })
        };

        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({success: false, message:"Refresh Token Not Found"})
        }

        const hashRefreshToken = hashToken(refreshToken);

        const session = await Session.findOne(
            {
                user: user_id,
                refreshTokenHash: hashRefreshToken,
                revoked: false
            }
        );

        if(!session){
            return res.status(401).json({ success: false, message: "Session Already Expired"})
        }
    

        session.revoked = true;
        await session.save();

        try {
            await createAuditLog({
                userId: user_id,
                action: "LOGOUT",
                resourceType: "Session",
                resourceId: session._id,
                metadata: {}
            });
        } catch (auditError) {
            console.error("Audit logging failed:", auditError.message);
        }

        res.clearCookie("refreshToken",clearCookieOptions);

        return res.status(200).json({success: true, message: "Logout SuccessFully"})
    }catch(error){
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


const logoutAll = async (req,res)=>{
    try{

        const user_id = req.user.id;

        if(!user_id || !mongoose.Types.ObjectId.isValid(user_id)){
            return res.status(400).json({ success: false, message: "User ID is invalid/Empty" })
        }

        const result = await Session.updateMany(
            {
                user:user_id,
                revoked:false
            },
            {
                $set:
                {
                    revoked:true
                }
            }
        );

         try {
            await createAuditLog({
                userId: user_id,
                action: "LOGOUT_ALL_SESSIONS",
                resourceType: "Session",
                metadata: {
                    revokedSessions: result.modifiedCount
                }
            });
        } catch (auditError) {
            console.error("Audit logging failed:", auditError.message);
        }

        res.clearCookie("refreshToken",clearCookieOptions);
        return res.status(200).json({success: true, message: "Successfully Logout from all Sessions"});

    }catch(error){
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


const refresh = async (req,res)=>{
    try{

        const oldRefreshToken = req.cookies.refreshToken;

        if(!oldRefreshToken){
            return res.status(401).json({success: false, message:"Refresh Token Not Found"})
        }

        const hashRefreshToken = hashToken(oldRefreshToken) 

        const decoded = jwt.verify(oldRefreshToken,process.env.REFRESHTOKEN_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if(!user){
            return res.status(404).json({ success: false, message: "User Not Found"})
        }

        const newRefreshToken = generateRefreshToken(user);
        const hashNewRefreshToken = hashToken(newRefreshToken);

        const session = await Session.findOneAndUpdate(
            {
                user: decoded.id,
                refreshTokenHash: hashRefreshToken,
                revoked: false
            },
            {
                $set: {
                    refreshTokenHash: hashNewRefreshToken,
                }
            },
            {
                new: true
            }
        );

        if(!session){
            return res.status(401).json({ success: false, message: "Session Already Expired"})
        }

        res.cookie("refreshToken",newRefreshToken,cookieOptions);


        const newAccessToken = generateAccessToken(user);

        return res.status(200).json({success: true, message: "Successfully Refresh Tokens",user: user,accessToken: newAccessToken});


    }catch(error){
        
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            res.clearCookie("refreshToken",clearCookieOptions);
            return res.status(401).json({ success: false, message: "Invalid or Expired Refresh Token" });
        }
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const me = async (req,res) => {
    try{

        const user_id = req.user.id;
        if(!mongoose.Types.ObjectId.isValid(user_id) || !user_id){
            return res.status(400).json({ success: false, message: "User ID is invalid/Empty" })
        };

        const user = await User.findById(user_id).select("-password");

        if(!user){
            return res.status(404).json({ success: false, message: "User Not Found"})
        }

        return res.status(200).json({ success: true, message: "Successfully User Fetched", user:user})

    }catch(error){
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


module.exports = {login, register, verifyRegistration, requestPasswordOtp, verifyPasswordUpdate, logout, logoutAll, refresh, me};
