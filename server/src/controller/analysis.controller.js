
const { analyzeIncident,getIncidentAnalyses,getAnalysisById} = require("../service/analysis.service");
const  createAuditLog  = require("../service/auditLog.service.js");

const createIncidentAnalysis = async (req, res, next) => {
  try {
    const { projectId, incidentId } = req.params;

    const result = await analyzeIncident({
      projectId,
      incidentId,
      userId: req.user.id
    });

     try {
        await createAuditLog({
                userId: req.user.id,
                action: "AI_ANALYSIS_COMPLETED",
                resourceType: "Incident",
                resourceId: incidentId,
                metadata: {
                    projectId
                }
            });
        } catch (auditError) {
            console.error("Audit logging failed:", auditError.message);
    }

    return res.status(201).json(result);
  } catch (error) {
     try {
        if (req.user?.id) {
            await createAuditLog({
                userId: req.user.id,
                action: "AI_ANALYSIS_FAILED",
                resourceType: "Incident",
                resourceId: req.params.incidentId,
                metadata: {
                    projectId: req.params.projectId,
                    errorType: error.name || "AnalysisError"
                }
            });
        }
    } catch (auditError) {
        console.error("Audit logging failed:", auditError.message);
    }

    next(error);
  }
};

const listIncidentAnalyses = async (req, res, next) => {
    try {
        const result = await getIncidentAnalyses({
            ...req.params,
            userId: req.user.id,
            page: req.query.page,
            limit: req.query.limit
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

const readAnalysisById = async (req, res, next) => {
    try {
        const result = await getAnalysisById({
            analysisId: req.params.analysisId,
            userId: req.user.id
        });

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {createIncidentAnalysis,listIncidentAnalyses,readAnalysisById};
