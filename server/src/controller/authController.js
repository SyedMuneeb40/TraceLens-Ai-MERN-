const User = require("../models/User.js")
const Session = require("../models/Session.js")
const mongoose = require("mongoose");
const {generateAccessToken,generateRefreshToken,hashToken,cookieOptions} = require("../utils/jwtUtils.js");
const  createAuditLog  = require("../service/auditLog.service.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const login = async (req,res)=>{
    try{
        const {email , password} = req.body;
        const user = await User.findOne(
            {
                email: email
            }
        ).select("+password");

        if(!user){
            return res.status(404).json({message:"User Not Found"})
        }

        const isMatched = await bcrypt.compare(password,user.password);
        if(!isMatched){
            return res.status(401).json({message:"Email/Password is Incorrect"})
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

        return res.status(200).json({message:"Successfully Login",user:userWithoutPassword,accessToken:accessToken});
        
    }catch(error){
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const register = async (req,res)=>{
    try{
        const {username, email, password} = req.body;

        const alreadyRegisterUser = await User.findOne(
            {
                $or:
                [
                    {username:username},
                    {email:email}
                ]
            }
        );

        if(alreadyRegisterUser){
            return res.status(409).json({message:"User Already Exists"})
        }
        
        const newUser = await User.create(
                {
                    username:username,
                    email:email,
                    password:password
                }
            );
        
        return res.status(201).json({message: "User Successfully Registered" , user: newUser});

    }catch(error){
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
};


const logout = async (req,res)=>{
    try{
        const user_id = req.user.id;
        if(!mongoose.Types.ObjectId.isValid(user_id) || !user_id){
            return res.status(400).json({ message: "User ID is invalid/Empty" })
        };

        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken){
            return res.status(401).json({message:"Refresh Token Not Found"})
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
            return res.status(401).json({ message: "Session Already Expired"})
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

        const {maxAge , ...otherOptions} = cookieOptions;
        res.clearCookie("refreshToken",otherOptions);

        return res.status(200).json({message: "Logout SuccessFully"})
    }catch(error){
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}


const logoutAll = async (req,res)=>{
    try{

        const user_id = req.user.id;

        if(!user_id || !mongoose.Types.ObjectId.isValid(user_id)){
            return res.status(400).json({ message: "User ID is invalid/Empty" })
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

        const {maxAge , ...otherOptions} = cookieOptions;
        res.clearCookie("refreshToken",otherOptions);
        return res.status(200).json({message: "Successfully Logout from all Sessions"});

    }catch(error){
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}


const refresh = async (req,res)=>{
    try{

        const oldRefreshToken = req.cookies.refreshToken;

        if(!oldRefreshToken){
            return res.status(401).json({message:"Refresh Token Not Found"})
        }

        const hashRefreshToken = hashToken(oldRefreshToken) 

        const decoded = jwt.verify(oldRefreshToken,process.env.REFRESHTOKEN_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if(!user){
            return res.status(404).json({ message: "User Not Found"})
        }

       const session = await Session.findOneAndUpdate(
            {
                user: decoded.id,
                refreshTokenHash: hashRefreshToken,
                revoked: false
            },
            {
                $set: {
                    refreshTokenHash: hashRefreshToken,
                }
            },
            {
                new: true
            }
        );

        if(!session){
            return res.status(401).json({ message: "Session Already Expired"})
        }
        const newRefreshToken = generateRefreshToken(user);
        const hashNewRefreshToken = hashToken(newRefreshToken);

        session.refreshTokenHash = hashNewRefreshToken;
        await session.save();

        res.cookie("refreshToken",newRefreshToken,cookieOptions);


        const newAccessToken = generateAccessToken(user);

        return res.status(200).json({message: "Successfully Refresh Tokens",user: user,accessToken: newAccessToken});


    }catch(error){
        
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Invalid or Expired Refresh Token", error: error.message });
        }
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

const me = async (req,res) => {
    try{

        const user_id = req.user.id;
        if(!mongoose.Types.ObjectId.isValid(user_id) || !user_id){
            return res.status(400).json({ message: "User ID is invalid/Empty" })
        };

        const user = await User.findById(user_id).select("-password");

        if(!user){
            return res.status(404).json({ message: "User Not Found"})
        }

        return res.status(200).json({ message: "Successfully User Fetched", user:user})

    }catch(error){
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}


module.exports = {login, register, logout, logoutAll, refresh, me}; 