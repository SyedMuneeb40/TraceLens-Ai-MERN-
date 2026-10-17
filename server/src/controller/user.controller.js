const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User.js");
const Session = require("../models/Session.js");
const Project = require("../models/Project.js");
const { generateAccessToken, clearCookieOptions } = require("../utils/jwtUtils.js");
const createAuditLog = require("../service/auditLog.service.js");

const allowedRoles = ["user", "admin"];

const userResponse = (user) => {
    const data = user.toObject ? user.toObject() : { ...user };
    delete data.password;
    return data;
};

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanUsername = (username) => {
    if (typeof username !== "string") return "";
    return username.trim().toLowerCase();
};

const cleanEmail = (email) => {
    if (typeof email !== "string") return "";
    return email.trim().toLowerCase();
};

const updateProfile = async (req,res,next)=>{
    try{
        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({success:false,message:"User Not Found"});
        }

        if(req.body.username !== undefined){
            const username = cleanUsername(req.body.username);
            if(username.length < 2 || username.length > 50){
                return res.status(400).json({success:false,message:"Username must be between 2 and 50 characters"});
            }
            user.username = username;
        }

        if(req.body.email !== undefined){
            const email = cleanEmail(req.body.email);
            if(!/^\S+@\S+\.\S+$/.test(email)){
                return res.status(400).json({success:false,message:"Email is invalid"});
            }
            user.email = email;
        }

        if(req.body.username === undefined && req.body.email === undefined){
            return res.status(400).json({success:false,message:"Username or email is required"});
        }

        await user.save();
        return res.status(200).json({success:true,message:"Profile updated successfully",user:userResponse(user),accessToken:generateAccessToken(user)});
    }catch(error){
        next(error);
    }
};

const changePassword = async (req,res,next)=>{
    try{
        const {currentPassword,newPassword} = req.body;
        if(typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword){
            return res.status(400).json({success:false,message:"Current password and new password are required"});
        }
        if(newPassword.length < 6){
            return res.status(400).json({success:false,message:"New password must be at least 6 characters"});
        }

        const user = await User.findById(req.user.id).select("+password");
        if(!user){
            return res.status(404).json({success:false,message:"User Not Found"});
        }

        const isMatched = await bcrypt.compare(currentPassword,user.password);
        if(!isMatched){
            return res.status(401).json({success:false,message:"Current password is incorrect"});
        }

        user.password = newPassword;
        await user.save();
        await Session.updateMany({user:user._id,revoked:false},{$set:{revoked:true}});
        res.clearCookie("refreshToken",clearCookieOptions);

        return res.status(200).json({success:true,message:"Password changed successfully. Please login again"});
    }catch(error){
        next(error);
    }
};

const listUsers = async (req,res,next)=>{
    try{
        const page = Math.max(1,Number.parseInt(req.query.page,10) || 1);
        const limit = Math.min(50,Math.max(1,Number.parseInt(req.query.limit,10) || 10));
        const filter = {};
        const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

        if(allowedRoles.includes(req.query.role)) filter.role = req.query.role;
        if(search){
            const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
            filter.$or = [{username:{$regex:safeSearch,$options:"i"}},{email:{$regex:safeSearch,$options:"i"}}];
        }

        const [users,total] = await Promise.all([
            User.find(filter).select("-password").sort({createdAt:-1}).skip((page - 1) * limit).limit(limit).lean(),
            User.countDocuments(filter)
        ]);

        return res.status(200).json({success:true,users,count:users.length,pagination:{page,limit,total,totalPages:Math.ceil(total / limit)}});
    }catch(error){
        next(error);
    }
};

const getUser = async (req,res,next)=>{
    try{
        const userId = req.params.userId || req.user.id;
        if(!validId(userId)) return res.status(400).json({success:false,message:"User ID is invalid"});
        const user = await User.findById(userId).select("-password");
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        return res.status(200).json({success:true,user});
    }catch(error){
        next(error);
    }
};

const updateUser = async (req,res,next)=>{
    try{
        const {userId} = req.params;
        if(!validId(userId)) return res.status(400).json({success:false,message:"User ID is invalid"});
        if(String(userId) === String(req.user.id) && req.body.role !== undefined){
            return res.status(400).json({success:false,message:"Use your own settings to update profile data"});
        }

        const user = await User.findById(userId);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});

        if(req.body.username !== undefined){
            const username = cleanUsername(req.body.username);
            if(username.length < 2 || username.length > 50) return res.status(400).json({success:false,message:"Username must be between 2 and 50 characters"});
            user.username = username;
        }
        if(req.body.email !== undefined){
            const email = cleanEmail(req.body.email);
            if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({success:false,message:"Email is invalid"});
            user.email = email;
        }
        if(req.body.role !== undefined){
            if(!allowedRoles.includes(req.body.role)) return res.status(400).json({success:false,message:"Role is invalid"});
            if(user.role === "admin" && req.body.role !== "admin" && await User.countDocuments({role:"admin"}) <= 1){
                return res.status(400).json({success:false,message:"The last admin cannot be changed"});
            }
            user.role = req.body.role;
        }

        await user.save();
        return res.status(200).json({success:true,message:"User updated successfully",user:userResponse(user)});
    }catch(error){
        next(error);
    }
};

const resetUserPassword = async (req,res,next)=>{
    try{
        const {newPassword} = req.body;
        if(!validId(req.params.userId)) return res.status(400).json({success:false,message:"User ID is invalid"});
        if(typeof newPassword !== "string" || newPassword.length < 6) return res.status(400).json({success:false,message:"New password must be at least 6 characters"});

        const user = await User.findById(req.params.userId);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});

        user.password = newPassword;
        await user.save();
        await Session.updateMany({user:user._id,revoked:false},{$set:{revoked:true}});
        return res.status(200).json({success:true,message:"User password reset successfully"});
    }catch(error){
        next(error);
    }
};

const removeUser = async (req,res,next)=>{
    try{
        const {userId} = req.params;
        if(!validId(userId)) return res.status(400).json({success:false,message:"User ID is invalid"});
        if(String(userId) === String(req.user.id)) return res.status(400).json({success:false,message:"You cannot remove your own account"});

        const user = await User.findById(userId);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        if(user.role === "admin" && await User.countDocuments({role:"admin"}) <= 1){
            return res.status(400).json({success:false,message:"The last admin cannot be removed"});
        }
        if(await Project.exists({owner:user._id})){
            return res.status(409).json({success:false,message:"Remove this user's projects before removing the user"});
        }

        await Session.deleteMany({user:user._id});
        await User.deleteOne({_id:user._id});
        return res.status(200).json({success:true,message:"User removed successfully"});
    }catch(error){
        next(error);
    }
};

const createAdmin = async (req,res,next)=>{
    try{
        const username = cleanUsername(req.body.username);
        const email = cleanEmail(req.body.email);
        const password = req.body.password;

        if(username.length < 2 || username.length > 50){
            return res.status(400).json({success:false,message:"Username must be between 2 and 50 characters"});
        }
        if(!/^\S+@\S+\.\S+$/.test(email)){
            return res.status(400).json({success:false,message:"Email is invalid"});
        }
        if(typeof password !== "string" || password.length < 6){
            return res.status(400).json({success:false,message:"Password must be at least 6 characters"});
        }

        const user = await User.create({username,email,password,role:"admin"});
        try {
            await createAuditLog({userId:req.user.id,action:"ADMIN_CREATED",resourceType:"User",resourceId:user._id,metadata:{username:user.username,email:user.email}});
        } catch (auditError) {
            console.error("Audit logging failed:", auditError.message);
        }
        return res.status(201).json({success:true,message:"Admin created successfully",user:userResponse(user)});
    }catch(error){
        next(error);
    }
};

module.exports = {updateProfile,changePassword,listUsers,getUser,updateUser,resetUserPassword,removeUser,createAdmin};
