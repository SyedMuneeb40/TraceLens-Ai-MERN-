const AuditLog = require("../models/AuditLogs.js");

const createAuditLog = async ({
    userId,
    action,
    resourceType,
    resourceId = null,
    metadata = {}
}) => {
    try {
        if (!userId || !action || !resourceType) {
            throw new Error("User, action, and resource type are required.");
        }

        return await AuditLog.create({
            user: userId,
            action,
            resourceType,
            resourceId,
            metadata
        });
    } catch (error) {
        console.error("Audit log creation failed:", error.message);
        throw error;
    }
};

module.exports =  createAuditLog ;