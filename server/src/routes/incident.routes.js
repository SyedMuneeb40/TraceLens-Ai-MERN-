const express = require("express");

const {submitIncidentLog,getIncidents,incidentById,searchIncidents} = require("../controller/incident.controller");
const {protect} = require("../middlewares/authMiddleware");
const { default: rateLimit } = require("express-rate-limit");

const incidentRoute = express.Router();

const incidentLimit = rateLimit(
    {
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: `draft-8`,
        legacyHeaders: false,
        statusCode: 429,
        message: "Too many attempts. Please try again later",
        handler: (req,res,next,option)=>{
            return res.status(option.statusCode).json({message:option.message});
        }
    }
)

incidentRoute.use(protect);
incidentRoute.use(incidentLimit);

incidentRoute.post("/process",submitIncidentLog);
incidentRoute.get("/:projectId",getIncidents);
incidentRoute.get("/:projectId/:incidentId",incidentById);
incidentRoute.post("/:projectId/search", searchIncidents);


module.exports = incidentRoute;
