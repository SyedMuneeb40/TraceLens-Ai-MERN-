const mongoose = require("mongoose");

const evaluationRunSchema = new mongoose.Schema(
    {
        name:
        {
            type:String,
            required:true
        },
        modelName:
        {
            type:String,
            default: "Qwen3-8B"
        },
        datasetVersion:
        {
            type:String,
            required: true
        },
        totalCases:
        {
            type:Number,
            required:true,
            min: 0
        },
        correctRootCauseCount:
        {
            type:Number,
            required:true,
            min: 0
        },
        evidenceGroundedCount:
        {
            type:Number,
            required:true,
            min: 0
        },
        unsupportedClaimCount:
        {
            type:Number,
            required:true,
            min: 0
        },
        averageConfidence:
        {
            type:Number,
            required:true,
            min: 0,
            max: 1
        },
        result:
        [
            {
                caseId:
                {
                    type:String,
                    required:true
                },
                expectedCause:
                {
                    type:String,
                    required:true
                },
                predictedCause:
                {
                    type:String,
                    required:true
                },
                rootCauseCorrect:
                {
                    type:Boolean,
                    required:true
                },
                evidenceGrounded:
                {
                    type:Boolean,
                    required:true
                },
                notes:
                {
                    type:String,
                    required:true
                },
            }
        ]
    },
    {
        timestamps:true
    }
);

evaluationRunSchema.index({createdAt: -1});

const EvaluationRun = mongoose.model("EvaluationRun",evaluationRunSchema);

module.exports = EvaluationRun;