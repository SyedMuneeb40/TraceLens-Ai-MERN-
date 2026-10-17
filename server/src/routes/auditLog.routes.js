const express = require("express");
const  getAuditLogs  = require("../controller/auditLog.controller");
const { protect, authorize } = require("../middlewares/authMiddleware");

const auditLogRoute = express.Router();

auditLogRoute.get("/", protect, authorize("admin"), getAuditLogs);

module.exports = auditLogRoute;
