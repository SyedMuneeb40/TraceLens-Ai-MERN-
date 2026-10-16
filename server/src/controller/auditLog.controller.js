const AuditLog = require("../models/AuditLogs.js");

const getAuditLogs = async (req, res, next) => {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
        );

        const skip = (page - 1) * limit;

        // Optional filters
        const filter = {};

        if (req.query.action) {
            filter.action = req.query.action;
        }

        if (req.query.resourceType) {
            filter.resourceType = req.query.resourceType;
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("user", "username email")
                .lean(),

            AuditLog.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = getAuditLogs;