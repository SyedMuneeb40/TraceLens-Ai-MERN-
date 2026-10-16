
const mongoose = require("mongoose");

const Analysis = require("../models/Analysis");
const Incident = require("../models/Incident");
const Project = require("../models/Project");

const analyzeWithOllama = require("./ollama.service");
const searchSimilarIncidents = require("./incidentSearch.service");

const analyzeIncident = async ({
  projectId,
  incidentId,
  userId
}) => {
  // 1. Validate IDs
  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(incidentId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    const error = new Error("Invalid project, incident or user ID.");
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify project ownership
  const project = await Project.findOne({
    _id: projectId,
    owner: userId
  });

  if (!project) {
    const error = new Error(
      "Project not found or you do not have access to it."
    );
    error.statusCode = 404;
    throw error;
  }

  // 3. Find incident inside the authorized project
  const incident = await Incident.findOne({
    _id: incidentId,
    project: project._id
  });

  if (!incident) {
    const error = new Error(
      "Incident not found in this project."
    );
    error.statusCode = 404;
    throw error;
  }

  // 4. Require stored evidence
  if (!Array.isArray(incident.logs) || incident.logs.length === 0) {
    const error = new Error("No stored evidence is available.");
    error.statusCode = 400;
    throw error;
  }

  // 5. Reject missing or duplicate evidence IDs
  const evidenceIds = incident.logs.map(
    (log) => log.sourceLineId
  );

  if (
    evidenceIds.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(evidenceIds).size !== evidenceIds.length
  ) {
    const error = new Error(
      "Evidence IDs are missing or duplicated. Repair stored evidence before analysis."
    );
    error.statusCode = 409;
    throw error;
  }

  
  const startedAt = Date.now();

  let relatedIncidents = [];

  try {
    relatedIncidents = await searchSimilarIncidents({
      projectId,
      userId,
      query: [
        incident.title,
        incident.errorType,
        incident.endpoint,
        ...incident.logs
          .slice(-50)
          .map((log) => log.message)
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 12000),
      limit: 10
    });

    relatedIncidents = relatedIncidents
      .filter(
        (item) => String(item._id) !== String(incident._id)
      )
      .slice(0, 5);
  } catch (error) {
    console.error(
      "Historical incident retrieval failed:",
      error.message
    );

    relatedIncidents = [];
  }

  const currentEvidence = incident.logs.map((log) => ({
    sourceLineId: log.sourceLineId,
    timestamp: log.timestamp,
    level: log.level,
    message: log.message,
    endpoint: log.endpoint,
    requestId: log.requestId,
    stackTrace: log.stackTrace
  }));

  const historicalContext = relatedIncidents.map((item) => ({
    incidentId: String(item._id),
    title: item.title,
    severity: item.severity,
    status: item.status,
    errorType: item.errorType,
    endpoint: item.endpoint,
    similarityScore: item.score,
    evidence: (item.logs || []).map((log) => ({
      message: log.message,
      level: log.level,
      endpoint: log.endpoint,
      stackTrace: log.stackTrace
    }))
  }));

  let aiResult;

  try {
    aiResult = await analyzeWithOllama({
      currentEvidence,
      historicalContext
    });
  } catch (error) {
    throw error;
  }

  const durationMs = Date.now() - startedAt;


  // 7. Validate response structure
  const isConfidenceValid = (value) =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1;

  if (
    !aiResult ||
    typeof aiResult.summary !== "string" ||
    !aiResult.summary.trim() ||
    !Array.isArray(aiResult.hypotheses) ||
    aiResult.hypotheses.length === 0 ||
    !Array.isArray(aiResult.missingInformation) ||
    !isConfidenceValid(aiResult.overallConfidence)
  ) {
    const error = new Error("AI returned an invalid analysis structure.");
    error.statusCode = 502;
    throw error;
  }

  const storedEvidenceIds = new Set(evidenceIds);

  for (const hypothesis of aiResult.hypotheses) {
    if (
      !hypothesis ||
      typeof hypothesis.cause !== "string" ||
      !hypothesis.cause.trim() ||
      !isConfidenceValid(hypothesis.confidence) ||
      typeof hypothesis.suggestedFix !== "string" ||
      !hypothesis.suggestedFix.trim() ||
      !Array.isArray(hypothesis.evidence) ||
      hypothesis.evidence.length === 0
    ) {
      const error = new Error("AI returned an invalid hypothesis.");
      error.statusCode = 502;
      throw error;
    }

    for (const item of hypothesis.evidence) {
      if (
        !item ||
        typeof item.sourceLineId !== "string" ||
        !storedEvidenceIds.has(item.sourceLineId) ||
        typeof item.explanation !== "string" ||
        !item.explanation.trim()
      ) {
        const error = new Error(
          "AI returned an invalid or unknown evidence reference."
        );
        error.statusCode = 502;
        throw error;
      }
    }
  }

  if (
  aiResult.missingInformation.some(
    (item) =>
      typeof item !== "string" || !item.trim()
  )
) {
  const error = new Error(
    "AI returned invalid missing-information entries."
  );
  error.statusCode = 502;
  throw error;
}

  // 9. Save the validated analysis
  const analysis = await Analysis.create({
    incident: incident._id,
    modelName: process.env.OLLAMA_MODEL || "qwen3:8b",
    runtime: "ollama",
    promptVersion: "v1",
    summary: aiResult.summary.trim(),
    hypotheses: aiResult.hypotheses,
    historicalReferences: relatedIncidents.map((item) => ({
            incident: item._id,
            similarityScore: item.score,
            title: item.title
        })),
    missingInformation: aiResult.missingInformation,
    overallConfidence: aiResult.overallConfidence,
    evidenceVerified: true,
    status: "completed",
    durationMs
  });

  return {
    success: true,
    analysis
  };
};


// Get all analyses for one incident
const getIncidentAnalyses = async ({ projectId, incidentId, userId, page = 1, limit = 10 }) => {
    if (
        !mongoose.isValidObjectId(projectId) ||
        !mongoose.isValidObjectId(incidentId) ||
        !mongoose.isValidObjectId(userId)
    ) {
        throw Object.assign(new Error("Invalid ID"), { statusCode: 400 });
    }

    const project = await Project.findOne({ _id: projectId, owner: userId });
    if (!project) {
        throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }

    const incident = await Incident.findOne({
        _id: incidentId,
        project: project._id
    });

    if (!incident) {
        throw Object.assign(new Error("Incident not found"), { statusCode: 404 });
    }

    page = Math.max(1, Number.parseInt(page, 10) || 1);
    limit = Math.min(50, Math.max(1, Number.parseInt(limit, 10) || 10));

    const [analyses, total] = await Promise.all([
        Analysis.find({ incident: incident._id })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        Analysis.countDocuments({ incident: incident._id })
    ]);

    return {
        success: true,
        analyses,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

// Get one analysis by ID, checking project ownership
const getAnalysisById = async ({ analysisId, userId }) => {
    if (
        !mongoose.isValidObjectId(analysisId) ||
        !mongoose.isValidObjectId(userId)
    ) {
        throw Object.assign(new Error("Invalid ID"), { statusCode: 400 });
    }

    const analysis = await Analysis.findById(analysisId).lean();

    if (!analysis) {
        throw Object.assign(new Error("Analysis not found"), { statusCode: 404 });
    }

    const incident = await Incident.findById(analysis.incident).select("project");

    if (!incident) {
        throw Object.assign(new Error("Incident not found"), { statusCode: 404 });
    }

    const project = await Project.findOne({
        _id: incident.project,
        owner: userId
    }).select("_id");

    if (!project) {
        throw Object.assign(new Error("Analysis not found"), { statusCode: 404 });
    }

    return { success: true, analysis };
};

module.exports = {analyzeIncident,getIncidentAnalyses,getAnalysisById};

