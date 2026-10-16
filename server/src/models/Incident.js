const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
    {
        project:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true
        },
        fingerprint:
        {
            type: String,
            required:true,
            trim:true,
        },
        title:
        {
            type:String,
            required:true,
            trim:true
        },
        severity:
        {
            type:String,
            enum:["low","medium","high","critical"],
            required:true,
            default: "medium"
        },
        status:
        {
            type: String,
            enum: ["open","investigating","resolved","ignored"],
            required: true
        },
        endpoint:
        {
            type: String
        },
        errorType:
        {
            type: String
        },
        firstSeenAt:
        {
            type: Date,
            required: true,
            default: Date.now 
        },
        lastSeenAt:
        {
            type:Date,
            default: Date.now
        },
        occurrenceCount:
        {
            type: Number,
            required: true,
            default: 1
        },
        logs:
        [
            {
                    sourceLineId: 
                    {
                        type: String
                    },
                    timestamp:
                    {
                        type: Date,
                        default: null
                    },
                    level:
                    {
                        type: String
                    },
                    message:
                    {
                        type: String,
                        required: true
                    },
                    requestId:
                    {
                        type: String
                    },
                    endpoint:
                    {
                        type:String
                    },
                    stackTrace:
                    {
                        type:String
                    }
            }
        ],
        embedding: [Number]
        
    },
    {
        timestamps:true
    }
);

incidentSchema.index({project:1 , fingerprint: 1},{ unique: true });
incidentSchema.index({project:1,status:1,lastSeenAt: -1});

const Incident = mongoose.model("Incident",incidentSchema);

module.exports = Incident;