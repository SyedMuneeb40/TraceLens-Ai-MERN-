const express = require("express");
const {protect , authorize} = require("../middlewares/authMiddleware.js")
const {login, register, logout, logoutAll, refresh, me} = require("../controller/authController.js");
const { default: rateLimit } = require("express-rate-limit");

const authLimiter = rateLimit(
    {
        windowMs: 10 * 60 * 1000,
        limit: 5,

        standardHeaders: `draft-8`,
        legacyHeaders: false,
        statusCode: 429,
        message: "Too many attempts are done please try again later",
        handler: (req,res,next,option)=>{
            return res.status(option.statusCode).json({message:option.message})
        }
    }
);

const AuthRoute = express.Router();

AuthRoute.use(authLimiter);

AuthRoute.post("/login",login)
AuthRoute.post("/register",register)

AuthRoute.post("/logout",protect,logout);
AuthRoute.post("/logout-all",protect,logoutAll);

AuthRoute.post("/refresh",refresh);
AuthRoute.get("/me",protect,me);






module.exports = AuthRoute;