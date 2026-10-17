
const express = require("express");

const {createIncidentAnalysis,listIncidentAnalyses,readAnalysisById} = require("../controller/analysis.controller");
const { protect } = require("../middlewares/authMiddleware");

const analysisRouter = express.Router();

analysisRouter.post("/projects/:projectId/incidents/:incidentId/analyze",protect,createIncidentAnalysis);
analysisRouter.get("/projects/:projectId/incidents/:incidentId/analyze",protect,listIncidentAnalyses);
analysisRouter.get("/:analysisId",protect,readAnalysisById);

module.exports = analysisRouter;
