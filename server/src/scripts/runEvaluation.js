require("dotenv").config();

const mongoose = require("mongoose");
const dbConnect = require("../config/databaseConfig.js");
const EvaluationRun = require("../models/EvaluationRun.js");
const evaluationDataset = require("../evaluation/incidentDataset.js");
const analyzeWithOllama = require("../service/ollama.service.js");

const normalize = (value) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const evaluateRootCause = (predictedCause, expectedKeywords) => {
    if (typeof predictedCause !== "string" || !predictedCause.trim()) {
        return false;
    }

    const prediction = normalize(predictedCause);

    return expectedKeywords.some((keyword) =>
        prediction.includes(normalize(keyword))
    );
};

const runEvaluation = async () => {
    try {
        await dbConnect();

        const results = [];

        let correctRootCauseCount = 0;
        let evidenceGroundedCount = 0;
        let invalidEvidenceReferenceCount = 0;
        let totalConfidence = 0;
        let successfulAnalysisCount = 0;

        for (const testCase of evaluationDataset) {
            console.log(`Evaluating ${testCase.caseId}...`);

            try {
                const aiResult = await analyzeWithOllama(testCase.logs);

                const predictedCause =
                    typeof aiResult.hypotheses?.[0]?.cause === "string"
                        ? aiResult.hypotheses[0].cause
                        : "";

                const rootCauseCorrect = evaluateRootCause(
                    predictedCause,
                    testCase.expectedKeywords
                );

                const validEvidenceIds = new Set(
                    testCase.logs.map((log) => log.sourceLineId)
                );

                const evidenceItems = (aiResult.hypotheses || [])
                    .flatMap((hypothesis) =>
                        Array.isArray(hypothesis.evidence)
                            ? hypothesis.evidence
                            : []
                    );

                console.log(
                    `Evidence IDs returned for ${testCase.caseId}:`,
                    evidenceItems.map((item) => ({
                        sourceLineId: item.sourceLineId,
                        explanation: item.explanation
                    }))
                );    

                const invalidEvidenceReference = evidenceItems.some(
                    (item) =>
                        !item.sourceLineId ||
                        !validEvidenceIds.has(item.sourceLineId)
                );


                const invalidEvidenceItems = evidenceItems.filter(
                    (item) =>
                        !item.sourceLineId ||
                        !validEvidenceIds.has(item.sourceLineId)
                );

                if (invalidEvidenceItems.length > 0) {
                    console.log(`Invalid evidence items for ${testCase.caseId}:`);

                    console.log(
                        JSON.stringify(invalidEvidenceItems, null, 2)
                    );
                }

                const malformedEvidenceItems = evidenceItems.filter(
                    (item) =>
                        !Object.prototype.hasOwnProperty.call(item, "sourceLineId")
                );

                if (malformedEvidenceItems.length > 0) {
                    console.log(`Malformed evidence fields in ${testCase.caseId}:`);
                    console.log(JSON.stringify(malformedEvidenceItems, null, 2));
                }

                const evidenceGrounded =
                    evidenceItems.length > 0 &&
                    !invalidEvidenceReference;

                if (rootCauseCorrect) {
                    correctRootCauseCount++;
                }

                if (evidenceGrounded) {
                    evidenceGroundedCount++;
                }

                if (invalidEvidenceReference) {
                    invalidEvidenceReferenceCount++;
                }

                const confidence = Number.isFinite(
                    aiResult.overallConfidence
                )
                    ? aiResult.overallConfidence
                    : null;

                if (confidence !== null) {
                    totalConfidence += confidence;
                    successfulAnalysisCount++;
                }

                results.push({
                    caseId: testCase.caseId,
                    expectedCause: testCase.expectedCause,
                    predictedCause:
                        predictedCause || "No prediction returned",
                    rootCauseCorrect,
                    evidenceGrounded,
                    notes:
                        `Keyword-based root-cause check. ` +
                        `Evidence references valid: ${!invalidEvidenceReference}. ` +
                        `Overall confidence: ${confidence ?? "Unavailable"}.`
                });
            } catch (error) {
                console.error(
                    `Failed ${testCase.caseId}:`,
                    error.message
                );

                results.push({
                    caseId: testCase.caseId,
                    expectedCause: testCase.expectedCause,
                    predictedCause: "Evaluation failed",
                    rootCauseCorrect: false,
                    evidenceGrounded: false,
                    notes: `Evaluation failed: ${error.message}`
                });
            }
        }

        const totalCases = evaluationDataset.length;

        const averageConfidence = successfulAnalysisCount > 0
            ? totalConfidence / successfulAnalysisCount
            : 0;

        const evaluationRun = await EvaluationRun.create({
            name: "Qwen3 Baseline Evaluation",
            modelName: process.env.OLLAMA_MODEL || "qwen3:8b",
            datasetVersion: "v1",
            totalCases,
            correctRootCauseCount,
            evidenceGroundedCount,
            unsupportedClaimCount: invalidEvidenceReferenceCount,
            averageConfidence,
            result: results
        });

        console.log("\nDetailed Evaluation Results:");

        evaluationRun.result.forEach((item) => {
            console.log("\nCase ID:", item.caseId);
            console.log("Expected Cause:", item.expectedCause);
            console.log("Predicted Cause:", item.predictedCause);
            console.log("Root Cause Correct:", item.rootCauseCorrect);
            console.log("Evidence Grounded:", item.evidenceGrounded);
            console.log("Notes:", item.notes);
        });

        console.log("\nEvaluation completed:");

        console.log({
            totalCases,
            successfulAnalysisCount,
            failedAnalysisCount: totalCases - successfulAnalysisCount,
            correctRootCauseCount,
            evidenceGroundedCount,
            invalidEvidenceReferenceCount,
            averageConfidence
        });

        console.log("Saved EvaluationRun:", evaluationRun._id);
    } finally {
        await mongoose.disconnect();
    }
};

runEvaluation().catch((error) => {
    console.error("Evaluation runner failed:", error);
    process.exitCode = 1;
});