const express = require("express");

const  getEvaluationRuns  = require("../controller/evaluation.controller.js");
const { protect, authorize } = require("../middlewares/authMiddleware.js");

const evaluationRoute = express.Router();

evaluationRoute.get("/",protect,authorize("admin"),getEvaluationRuns);

module.exports = evaluationRoute;
