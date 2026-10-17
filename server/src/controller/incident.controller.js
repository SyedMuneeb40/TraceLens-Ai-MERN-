const {processIncidentLogs,incidentHistory,getIncidentById} = require("../service/incidentProcessing.service");
const searchSimilarIncidents = require("../service/incidentSearch.service.js");
const  createAuditLog  = require("../service/auditLog.service.js");
const Incident = require("../models/Incident");
const Project = require("../models/Project");



const mongoose = require("mongoose");




const submitIncidentLog = async (req,res,next)=>{
    try{
        const userId = req.user.id;
        const {projectId,rawLogs} = req.body;

        if(!projectId || typeof rawLogs !== "string" || !rawLogs.trim()){
            return res.status(400).json({success: false,message:"Project ID and non-empty logs must be provided"})
        };

        if(!mongoose.Types.ObjectId.isValid(userId) || !userId){
            return res.status(401).json({success: false,message: "User Id is Invalid/Not Found"});
        }

        const result = await processIncidentLogs({projectId,userId,rawLogs});

        
        try {
            const incident = result.incident;

            const storedLogs = Array.isArray(incident.logs)
                ? incident.logs
                : [];

            const searchQuery = [
                incident.title,
                incident.errorType,
                incident.endpoint,
                ...storedLogs
                    .slice(-50)
                    .map((log) => log.message)
            ]
                .filter(Boolean)
                .join("\n")
                .slice(0, 12000);

            const matches = await searchSimilarIncidents({
                projectId,
                userId,
                query: searchQuery,
                limit: 5
            });

                
            const relatedIncidents = matches
                .filter(
                    (match) =>
                        String(match._id) !== String(incident._id)
                )
                .slice(0, 5)
                .map((match) => ({
                    _id: match._id,
                    title: match.title,
                    severity: match.severity,
                    status: match.status,
                    errorType: match.errorType,
                    endpoint: match.endpoint,
                    occurrenceCount: match.occurrenceCount,
                    lastSeenAt: match.lastSeenAt,
                    similarityScore: match.score,

                    historicalEvidence: (match.logs || []).map((log) => ({
                        message: log.message,
                        level: log.level,
                        endpoint: log.endpoint,
                        stackTrace: log.stackTrace
                    }))
                }));

result.relatedIncidents = relatedIncidents;

        } catch (searchError) {
            // Semantic search must not break incident submission.
            console.error(
                "Similar incident retrieval failed:",
                searchError.message
            );

            result.relatedIncidents = [];
        }


        try {
            await createAuditLog({
                userId,
                action: result.action === "created"
                    ? "INCIDENT_CREATED"
                    : "INCIDENT_UPDATED",
                resourceType: "Incident",
                resourceId: result.incident._id,
                metadata: {
                    projectId,
                    evidenceCount: result.evidenceCount
                }
            });
        } catch (auditError) {
            console.error("Audit logging failed:", auditError.message);
        }

        const responseResult = {
            ...result,
            incident: result.incident?.toObject
                ? result.incident.toObject()
                : { ...result.incident }
        };

        if (responseResult.incident) {
            delete responseResult.incident.embedding;
        }

        return res
            .status(result.action === "created" ? 201 : 200)
            .json(responseResult);

    }catch(error){

         try {
            if (req.user?.id) {
                await createAuditLog({
                    userId: req.user.id,
                    action: "INCIDENT_SUBMISSION_FAILED",
                    resourceType: "Incident",
                    metadata: {
                        projectId: req.body.projectId || null,
                        errorType: error.name || "IncidentSubmissionError"
                    }
                });
            }
        } catch (auditError) {
            console.error("Audit logging failed:", auditError.message);
        }


        console.log(error.message);
        next(error);
    }
}

const getIncidents =  async (req,res,next)=>{
    try{
        const projectId = req.params.projectId;
        const userId = req.user.id;

        const incidents = (await incidentHistory(projectId,userId));
        if(incidents.length === 0){
            return res.status(200).json({incidents,message: "You have no Incidents Yet",success: true})
        }
        return res.status(200).json({success: true,message: "Successfully retrieved Incidents",incidents})
    }catch(error){
        console.log(error.message);
        next(error)
    }
};


const incidentById = async (req,res,next)=>{
    try{
        const projectId = req.params.projectId;
        const incidentId = req.params.incidentId;
        const userId = req.user.id;

        const incident = await getIncidentById(projectId,incidentId,userId);
        return res.status(200).json({success:true,message:"Successfully found Incident",incident});
    }catch(error){
        console.log(error.message);
        next(error);
    }
}


const searchIncidents = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { query, limit } = req.body;
        const userId = req.user.id;

        if (typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "A non-empty search query is required."
            });
        }

        const incidents = await searchSimilarIncidents({
            projectId,
            userId,
            query,
            limit
        });

        return res.status(200).json({
            success: true,
            message: "Similar incidents retrieved successfully.",
            count: incidents.length,
            incidents
        });
    } catch (error) {
        console.log(error.message);
        next(error);
    }
};

const updateIncident = async (req,res,next)=>{
    try{
        const {projectId,incidentId} = req.params;
        const {status} = req.body;
        const userId = req.user.id;
        const allowedStatus = ["open","investigating","resolved","ignored"];

        if(!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(incidentId)){
            return res.status(400).json({success:false,message:"Project ID or Incident ID is invalid"});
        }

        if(!allowedStatus.includes(status)){
            return res.status(400).json({success:false,message:"Status is invalid"});
        }

        const project = await Project.findOne({_id:projectId,owner:userId});
        if(!project){
            return res.status(404).json({success:false,message:"Project not found or you do not have access to it"});
        }

        const incident = await Incident.findOneAndUpdate(
            {_id:incidentId,project:projectId},
            {$set:{status}},
            {new:true,runValidators:true}
        ).select("-embedding");

        if(!incident){
            return res.status(404).json({success:false,message:"Incident not found in this project"});
        }

        return res.status(200).json({success:true,message:"Incident status updated successfully",incident});
    }catch(error){
        next(error);
    }
};


module.exports = {submitIncidentLog,getIncidents,incidentById,searchIncidents,updateIncident};
