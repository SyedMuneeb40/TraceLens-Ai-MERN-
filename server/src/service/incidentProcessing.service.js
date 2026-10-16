
const mongoose = require("mongoose");

const Project = require("../models/Project");
const Incident = require("../models/Incident");

const generateEmbedding  = require("./embedding.service");

const  parseLogs  = require("../service/logParser.service");
const redactSecrets  = require("../service/logRedaction.service");
const createIncidentFingerprint = require("../service/incidentFingerprint.service");

function createError(message, status = 400) {
  const error = new Error(message);
  error.statusCode = status;
  throw error;
}

const getEvidenceSeverity = (level) => {
  switch (level) {
    case "FATAL":
      return "critical";

    case "ERROR":
      return "high";

    case "WARN":
    case "WARNING":
      return "medium";

    default:
      return "low";
  }
};


const findErrorEvidence = (evidence) => {
  const exceptionEvidence = evidence.find((item) =>
    /\b[A-Za-z_$][\w$]*(?:Error|Exception)\s*:/.test(
      item.message
    )
  );

  if (exceptionEvidence) {
    return exceptionEvidence;
  }

  return evidence.find((item) =>
    item.level === "ERROR" || item.level === "FATAL"
  );
};


const processIncidentLogs = async ({
  projectId,
  userId,
  rawLogs
}) => {
  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(userId)
  ) {
    createError("Invalid project or user ID.", 400);
  }

  if (typeof rawLogs !== "string" || !rawLogs.trim()) {
    createError("Logs must be a non-empty string", 400);
  }

  const project = await Project.findOne({
    _id: projectId,
    owner: userId
  });

  if (!project) {
    createError(
      "Project not found or you do not have access to it.",
      404
    );
  }

  const sanitizedLogs = redactSecrets(rawLogs);

  const evidence = parseLogs(sanitizedLogs);

  const errorEvidence = findErrorEvidence(evidence);

  if (!errorEvidence) {
    createError(
      "No recognizable error line was found in the logs.",
      400
    );
  }

  const errorTypeMatch = errorEvidence.message.match(
    /\b([A-Za-z_$][\w$]*(?:Error|Exception))\s*:/
  );

  const errorType = errorTypeMatch
    ? errorTypeMatch[1]
    : "Error";

  const endpoint =
    errorEvidence.endpoint ||
    evidence.find((item) => item.endpoint)?.endpoint ||
    null;

  const title = errorEvidence.message.slice(0, 200);


  const severityEvidence =
  errorEvidence.level
    ? errorEvidence
    : evidence.find(
        (item) =>
          item.level === "FATAL" ||
          item.level === "ERROR" ||
          item.level === "WARN" ||
          item.level === "WARNING"
      );

  const severity = getEvidenceSeverity(severityEvidence?.level);

  const fingerprint = createIncidentFingerprint({
    projectId: project._id.toString(),
    endpoint,
    errorType,
    errorMessage: errorEvidence.message
  });

  const validTimestamps = evidence
    .map((item) => item.timestamp)
    .filter(
      (date) =>
        date instanceof Date &&
        !Number.isNaN(date.getTime())
    );

  const observedAt = validTimestamps.length
    ? new Date(
        Math.max(
          ...validTimestamps.map((date) => date.getTime())
        )
      )
    : new Date();

  // Keep a maximum of 200 evidence lines per stored incident
  const logsToStore = evidence.slice(-200);

  const embeddingText = [
        `Error Type: ${errorType}`,
        `Endpoint: ${endpoint || "Unknown"}`,
        `Error Message: ${errorEvidence.message}`,
        ...logsToStore.map((log) => log.message)
    ].join("\n");

  const embedding = await generateEmbedding(embeddingText);

  const incidentData = {
    project: project._id,
    fingerprint,
    title,
    severity,
    endpoint,
    errorType
  };

  const updateExistingIncident = async (filter) => {
    return Incident.findOneAndUpdate(
      filter,
      {
        $set: {
          title,
          severity,
          endpoint,
          errorType,
          lastSeenAt: observedAt,
          embedding:embedding
        },
        $inc: {
          occurrenceCount: 1
        },
        $push: {
          logs: {
            $each: logsToStore,
            $slice: -200
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );
  };

  let incident = await Incident.findOne({
    project: project._id,
    fingerprint
  });

  if (incident) {
    incident = await updateExistingIncident({
      _id: incident._id
    });

    return {
      success: true,
      incident,
      action: "updated",
      evidenceCount: evidence.length
    };
  }

  // 10. Create a new incident
  try {
    incident = await Incident.create({
      ...incidentData,
      firstSeenAt: observedAt,
      lastSeenAt: observedAt,
      occurrenceCount: 1,
      status: "open",
      logs: logsToStore,
      embedding: embedding
    });

    return {
      success: true,
      incident,
      action: "created",
      evidenceCount: evidence.length
    };
  } catch (error) {
    // A concurrent request may have created the same incident.
    if (error.code !== 11000) {
      throw error;
    }

    incident = await updateExistingIncident({
      project: project._id,
      fingerprint
    });

    if (!incident) {
      throw error;
    }

    return {
      success: true,
      incident,
      action: "updated",
      evidenceCount: evidence.length
    };
  }
};


const incidentHistory = async (projectId,userId)=>{
  
  if(!projectId || !userId){
    createError("Project/User Not Found",404);
  }
  
  if(!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId)){
    createError("ProjectID/UserID is invalid")
  }

  const project = await Project.findOne(
    {
      _id:projectId,
      owner: userId,
    }
  );

  if(!project){
    createError("Project not found or you do not have access to it.", 404);
  }

  const incidents = await Incident.find(
    {
      project: projectId
    }
  ).sort({lastSeenAt: -1});

  return incidents;

}

const getIncidentById = async (projectId,incidentId,userId)=>{
  if(!projectId || !userId || !incidentId){
    createError("Project/User/incident Not Found");
  }
  
  if(!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(incidentId)){
    createError("ProjectID/UserID/IncidentID is invalid")
  }

  const project = await Project.findOne(
    {
      _id:projectId,
      owner: userId,
    }
  );

  if(!project){
    createError("Project Not Found/Not Your Project",404)
  }

  const incident = await Incident.findOne({
        _id: incidentId,
        project: projectId
  });

  if (!incident) {
        createError("Incident not found in this project.", 404);
  }

  return incident;
}

module.exports = {processIncidentLogs,incidentHistory,getIncidentById};
