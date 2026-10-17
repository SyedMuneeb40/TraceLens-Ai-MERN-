const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware.js");
const { updateProfile, listUsers, getUser, updateUser, resetUserPassword, removeUser, createAdmin } = require("../controller/user.controller.js");
const { requestPasswordOtp, verifyPasswordUpdate } = require("../controller/authController.js");
const { default: rateLimit } = require("express-rate-limit");

const userRoute = express.Router();
const passwordOtpSendLimiter = rateLimit({windowMs:20 * 60 * 1000,limit:5,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many verification codes requested. Try again in 20 minutes."}});
const passwordOtpVerifyLimiter = rateLimit({windowMs:15 * 60 * 1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many verification attempts. Please try again later."}});

userRoute.get("/me",protect,authorize("user","admin"),getUser);
userRoute.patch("/me",protect,authorize("user","admin"),updateProfile);
userRoute.post("/me/password/otp",protect,authorize("user","admin"),passwordOtpSendLimiter,requestPasswordOtp);
userRoute.patch("/me/password",protect,authorize("user","admin"),passwordOtpVerifyLimiter,verifyPasswordUpdate);

userRoute.post("/admins",protect,authorize("admin"),createAdmin);
userRoute.get("/",protect,authorize("admin"),listUsers);
userRoute.get("/:userId",protect,authorize("admin"),getUser);
userRoute.patch("/:userId",protect,authorize("admin"),updateUser);
userRoute.patch("/:userId/password",protect,authorize("admin"),resetUserPassword);
userRoute.delete("/:userId",protect,authorize("admin"),removeUser);

module.exports = userRoute;
