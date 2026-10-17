const mongoose = require("mongoose");

const User = require("../models/User.js");
const Project = require("../models/Project.js");
const Incident = require("../models/Incident.js");
const Analysis = require("../models/Analysis.js");
const EvaluationRun = require("../models/EvaluationRun.js");
const AuditLog = require("../models/AuditLogs.js");
const createAuditLog = require("../service/auditLog.service.js");
const { getMetrics } = require("../service/metrics.service.js");

const allowedStatuses = ["open", "investigating", "resolved", "ignored"];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const badId = (res) => res.status(400).json({ success: false, message: "User or incident ID is invalid" });

const getOverview = async (req, res, next) => {
    try {
        const [totalUsers, totalProjects, totalIncidents, totalAnalyses, userRoles, analysisStats, evaluationRuns, recentActivity] = await Promise.all([
            User.countDocuments(),
            Project.countDocuments(),
            Incident.countDocuments(),
            Analysis.countDocuments(),
            User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
            Analysis.aggregate([
                {
                    $group: {
                        _id: null,
                        averageConfidence: { $avg: "$overallConfidence" },
                        averageDurationMs: { $avg: "$durationMs" },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
                    }
                }
            ]),
            EvaluationRun.find().sort({ createdAt: -1 }).limit(8).lean(),
            AuditLog.find().sort({ createdAt: -1 }).limit(8).populate("user", "username email role").lean()
        ]);

        const analysisSummary = analysisStats[0] || {};
        const roleSummary = userRoles.reduce((result, item) => ({ ...result, [item._id]: item.count }), {});
        const evaluationTrend = evaluationRuns
            .slice()
            .reverse()
            .map((run) => ({
                name: run.name,
                date: run.createdAt,
                accuracy: run.totalCases ? Number((run.correctRootCauseCount / run.totalCases).toFixed(3)) : 0,
                evidenceGrounded: run.totalCases ? Number((run.evidenceGroundedCount / run.totalCases).toFixed(3)) : 0,
                confidence: run.averageConfidence || 0,
                totalCases: run.totalCases || 0
            }));

        return res.status(200).json({
            success: true,
            data: {
                counts: {
                    users: totalUsers,
                    admins: roleSummary.admin || 0,
                    regularUsers: roleSummary.user || 0,
                    projects: totalProjects,
                    incidents: totalIncidents,
                    analyses: totalAnalyses
                },
                performance: getMetrics(),
                analysis: {
                    completed: analysisSummary.completed || 0,
                    averageConfidence: Number((analysisSummary.averageConfidence || 0).toFixed(3)),
                    averageDurationMs: Number((analysisSummary.averageDurationMs || 0).toFixed(2))
                },
                evaluations: {
                    latest: evaluationRuns[0] || null,
                    trend: evaluationTrend
                },
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
};

const getUserIncidents = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!isValidId(userId)) return badId(res);

        const user = await User.findById(userId).select("username email role").lean();
        if (!user) return res.status(404).json({ success: false, message: "User Not Found" });

        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
        const projects = await Project.find({ owner: userId }).select("_id name environment").lean();
        const projectIds = projects.map((project) => project._id);
        const filter = { project: { $in: projectIds } };
        if (allowedStatuses.includes(req.query.status)) filter.status = req.query.status;

        const [incidents, total] = await Promise.all([
            Incident.find(filter)
                .select("-embedding")
                .populate("project", "name environment")
                .sort({ lastSeenAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Incident.countDocuments(filter)
        ]);

        const incidentIds = incidents.map((incident) => incident._id);
        const analysisCounts = await Analysis.aggregate([
            { $match: { incident: { $in: incidentIds } } },
            { $group: { _id: "$incident", count: { $sum: 1 } } }
        ]);
        const countMap = new Map(analysisCounts.map((item) => [String(item._id), item.count]));

        return res.status(200).json({
            success: true,
            user,
            projects,
            incidents: incidents.map((incident) => ({ ...incident, analysisCount: countMap.get(String(incident._id)) || 0 })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

const getIncidentAnalyses = async (req, res, next) => {
    try {
        const { userId, incidentId } = req.params;
        if (!isValidId(userId) || !isValidId(incidentId)) return badId(res);

        const incident = await Incident.findById(incidentId).select("project").lean();
        const project = incident
            ? await Project.findOne({ owner: userId, _id: incident.project }).select("_id").lean()
            : null;
        if (!project) return res.status(404).json({ success: false, message: "Incident not found for this user" });

        const analyses = await Analysis.find({ incident: incidentId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json({ success: true, analyses });
    } catch (error) {
        next(error);
    }
};

const updateIncident = async (req, res, next) => {
    try {
        const { userId, incidentId } = req.params;
        const { status } = req.body;
        if (!isValidId(userId) || !isValidId(incidentId)) return badId(res);
        if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Status is invalid" });

        const projectIds = await Project.find({ owner: userId }).distinct("_id");
        const incident = await Incident.findOneAndUpdate({ _id: incidentId, project: { $in: projectIds } }, { $set: { status } }, { new: true, runValidators: true }).select("-embedding");
        if (!incident) return res.status(404).json({ success: false, message: "Incident not found for this user" });

        await createAuditLog({ userId: req.user.id, action: "ADMIN_INCIDENT_UPDATED", resourceType: "Incident", resourceId: incident._id, metadata: { targetUserId: userId, status } });
        return res.status(200).json({ success: true, message: "Incident status updated successfully", incident });
    } catch (error) {
        next(error);
    }
};

const removeIncident = async (req, res, next) => {
    try {
        const { userId, incidentId } = req.params;
        if (!isValidId(userId) || !isValidId(incidentId)) return badId(res);

        const projectIds = await Project.find({ owner: userId }).distinct("_id");
        const incident = await Incident.findOne({ _id: incidentId, project: { $in: projectIds } }).select("_id project");
        if (!incident) return res.status(404).json({ success: false, message: "Incident not found for this user" });

        await Analysis.deleteMany({ incident: incident._id });
        await Incident.deleteOne({ _id: incident._id });
        await createAuditLog({ userId: req.user.id, action: "ADMIN_INCIDENT_DELETED", resourceType: "Incident", resourceId: incident._id, metadata: { targetUserId: userId, projectId: incident.project } });
        return res.status(200).json({ success: true, message: "Incident removed successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports = { getOverview, getUserIncidents, getIncidentAnalyses, updateIncident, removeIncident };
