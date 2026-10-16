
const mongoose = require("mongoose");

const Incident = require("../models/Incident.js");
const Project = require("../models/Project.js");
const  generateEmbedding  = require("./embedding.service.js");

const searchSimilarIncidents = async ({
    projectId,
    userId,
    query,
    limit = 10
}) => {
    if (
        !mongoose.isValidObjectId(projectId) ||
        !mongoose.isValidObjectId(userId)
    ) {
        const error = new Error("Invalid project or user ID.");
        error.statusCode = 400;
        throw error;
    }

    if (typeof query !== "string" || !query.trim()) {
        const error = new Error("Search query is required.");
        error.statusCode = 400;
        throw error;
    }

    // Confirm that this project belongs to the logged-in user.
    const project = await Project.findOne({
        _id: projectId,
        owner: userId
    }).select("_id");

    if (!project) {
        const error = new Error("Project not found or access denied.");
        error.statusCode = 404;
        throw error;
    }

    // Generate a vector using the same model as stored incident vectors.
    const queryVector = await generateEmbedding(query.trim());

    if (queryVector.length !== 768) {
        const error = new Error("Invalid embedding dimensions.");
        error.statusCode = 500;
        throw error;
    }

    const safeLimit = Math.min(
        Math.max(Number.parseInt(limit, 10) || 10, 1),
        20
    );

    const incidents = await Incident.aggregate([
        {
            $vectorSearch: {
                index: "incident_embedding_index",
                path: "embedding",
                queryVector,
                numCandidates: Math.max(safeLimit * 10, 100),
                limit: safeLimit,
                filter: {
                    project: project._id
                }
            }
        },
        {
            $project: {
                title: 1,
                severity: 1,
                status: 1,
                errorType: 1,
                endpoint: 1,
                fingerprint: 1,
                occurrenceCount: 1,
                logs: {
                    $slice: ["$logs", -10]
                },
                lastSeenAt: 1,
                score: {
                    $meta: "vectorSearchScore"
                }
            }
        }
    ]);

    return incidents;
};

module.exports =  searchSimilarIncidents ;
