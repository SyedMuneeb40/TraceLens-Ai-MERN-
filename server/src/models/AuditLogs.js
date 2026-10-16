const mongoose = require("mongoose");


const auditLogSchema = new mongoose.Schema(
    {
        user:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required:true
        },
        action:
        {
            type:String,
            required:true
        },
        resourceType:
        {
            type:String,
            required:true
        },
        resourceId:
        {
            type:mongoose.Schema.Types.ObjectId
        },
        metadata:
        {
            type:Object,
            required:true
        },
    },
    {
        timestamps: true
    }
);

const AuditLog = mongoose.model("AuditLog",auditLogSchema);

module.exports = AuditLog;