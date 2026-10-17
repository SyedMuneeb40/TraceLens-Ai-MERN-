const express = require("express");
const {protect , authorize} = require("../middlewares/authMiddleware.js")
const {login, register, verifyRegistration, requestPasswordOtp, verifyPasswordUpdate, logout, logoutAll, refresh, me} = require("../controller/authController.js");
const { default: rateLimit } = require("express-rate-limit");

const authLimiter = rateLimit(
    {
        windowMs: 20 * 60 * 1000,
        limit: 15,

        standardHeaders: `draft-8`,
        legacyHeaders: false,
        statusCode: 429,
        message: "Too many attempts are done please try again later",
        handler: (req,res,next,option)=>{
            return res.status(option.statusCode).json({success: false, message:option.message})
        }
    }
);

const AuthRoute = express.Router();
const createOtpSendLimiter = () => rateLimit({windowMs:20 * 60 * 1000,limit:5,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many verification codes requested. Try again in 20 minutes."}});
const registrationOtpLimiter = createOtpSendLimiter();
const passwordOtpLimiter = createOtpSendLimiter();
const otpVerifyLimiter = rateLimit({windowMs:15 * 60 * 1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many verification attempts. Please try again later."}});

AuthRoute.post("/login",authLimiter,login)
AuthRoute.post("/register",authLimiter,registrationOtpLimiter,register)
AuthRoute.post("/register/verify",otpVerifyLimiter,verifyRegistration)
AuthRoute.post("/password/otp",protect,authorize("user","admin"),passwordOtpLimiter,requestPasswordOtp)
AuthRoute.post("/password/update",protect,authorize("user","admin"),otpVerifyLimiter,verifyPasswordUpdate)

AuthRoute.post("/logout",protect,logout);
AuthRoute.post("/logout-all",protect,logoutAll);

AuthRoute.post("/refresh",refresh);
AuthRoute.get("/me",protect,me);






module.exports = AuthRoute;
