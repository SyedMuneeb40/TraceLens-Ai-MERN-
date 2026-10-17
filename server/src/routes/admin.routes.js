const express = require("express");
const { protect, authorize } = require("../middlewares/authMiddleware.js");
const { getOverview, getUserIncidents, getIncidentAnalyses, updateIncident, removeIncident } = require("../controller/admin.controller.js");

const adminRoute = express.Router();

adminRoute.use(protect, authorize("admin"));
adminRoute.get("/overview", getOverview);
adminRoute.get("/users/:userId/incidents", getUserIncidents);
adminRoute.get("/users/:userId/incidents/:incidentId/analyses", getIncidentAnalyses);
adminRoute.patch("/users/:userId/incidents/:incidentId", updateIncident);
adminRoute.delete("/users/:userId/incidents/:incidentId", removeIncident);

module.exports = adminRoute;
