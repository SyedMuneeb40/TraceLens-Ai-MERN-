
const jwt = require("jsonwebtoken");
const User = require("../models/User");



const protect = async (req,res,next)=>{

    try{
        const accessToken = req.headers['authorization'];
        
        if(!accessToken || !accessToken.startsWith("Bearer ")){
            return res.status(401).json({message:"No Access-Token Found"})
        }

        const token = accessToken.split(" ")[1];
        const decoded = jwt.verify(token,process.env.ACCESSTOKEN_SECRET);
        const user = await User.findById(decoded.id);
        if(!user){
            return res.status(404).json({ message: "User Not Found"})
        }
        req.user = decoded;
        next();

    }catch(error){
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Invalid or Expired Access Token", error: error.message });
        }
        return res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}


const authorize =  (...allowedRoles) => {
    return  (req,res,next) => {

        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: "Not Authorized, User session missing OR Not Login" });
        }

        if(!allowedRoles.includes(req.user.role)){
            return res.status(403).json({message: "You Dont Have Permission For This"})
        }
        next();
    }
}

module.exports = {protect, authorize};