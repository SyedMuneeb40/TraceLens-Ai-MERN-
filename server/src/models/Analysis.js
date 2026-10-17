const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
    {
        incident:
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: true
        },
        modelName:
        {
            type:String,
            required: true,
            default: "Qwen3-8b"
        },
        runtime:
        {
            type:String,
            enum: ["ollama","huggingface-zerogpu","openrouter"],
            default: "openrouter"
        },
        promptVersion:
        {
            type:String,
            required: true
        },
        summary:
        {
            type:String,
            required:true
        },
        hypotheses:
        [
            {
                cause:
                {
                    type:String,
                    required:true
                },
                confidence:
                {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 1
                },
                evidence: 
                [
                    {
                        sourceLineId:
                        {
                            type: String,
                            required:true
                        },
                        explanation:
                        {
                            type: String,
                            required:true
                        }
                    }
                ],
                suggestedFix:
                {
                    type: String,
                    required:true
                }
            }
        ],
        historicalReferences: [
            {
                incident: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Incident",
                    required: true
                },
                similarityScore: {
                    type: Number,
                    min: 0,
                    max: 1
                },
                title: {
                    type: String,
                    required: true
                }
            }
        ],
        missingInformation:[String],
        overallConfidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        evidenceVerified:
        {
            type: Boolean,
            default: false,
            required:true
        },
        status:
        {
            type:String,
            enum:["completed","invalid","failed"],
            required:true
        },
        durationMs:
        {
            type:Number,
            required:true
        }
    },
    {
        timestamps:true
    }
);

analysisSchema.index({incident:1 , createdAt: -1});

const Analysis = mongoose.model("Analysis",analysisSchema);

module.exports = Analysis;