const express = require("express");
const cookieParser = require("cookie-parser");
const AuthRoute = require("./routes/authRoutes.js")
const ProjectRoute = require("./routes/project.routes.js")
const incidentRoute = require("./routes/incident.routes.js");
const evaluationRoute = require("./routes/evaluation.routes.js");
const analysisRoutes = require("./routes/analysis.routes");
const auditLogRoute = require("./routes/auditLog.routes");
const userRoute = require("./routes/user.routes");
const adminRoute = require("./routes/admin.routes.js");
const cors = require("cors");
const { requestMetrics } = require("./service/metrics.service.js");

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [process.env.FRONTEND_URL , `http://localhost:5173`],
    credentials: true
}));
app.use(requestMetrics);


app.use("/api/auth",AuthRoute);
app.use("/api/projects",ProjectRoute);
app.use("/api/incidents",incidentRoute);
app.use("/api/analysis", analysisRoutes);
app.use("/api/evaluations", evaluationRoute);
app.use("/api/audit-logs", auditLogRoute);
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);

app.use("/health",(req,res,next)=>{ return res.status(200).json({message:"Project Sucessfully Running"})});

app.use((err,req,res,next)=>{
    console.error(err)
    let statusCode = err.statusCode || 500;
    let message = statusCode < 500
        ? err.message
        : "Internal server error";


    // Mongoose validation error
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = "Validation failed";
    }

    // Invalid MongoDB ObjectId / Cast error
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID or value";
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        statusCode = 409;
        message = "A record with this value already exists";
    }

    if (res.headersSent) {
        return next(err);
    }

    return res.status(statusCode).json({
        success: false,
        message
    });
    
})


module.exports = app;


