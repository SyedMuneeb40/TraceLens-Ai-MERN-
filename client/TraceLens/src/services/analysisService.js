import api from "./Api"


export const analyzeIncidentApi = async (projectId,incidentId)=>{
    const response = await api.post(`/api/analysis/projects/${projectId}/incidents/${incidentId}/analyze`);
    return response.data;
}

export const getAllAnalyzeApi = async (projectId,incidentId)=>{
    const response = await api.get(`/api/analysis/projects/${projectId}/incidents/${incidentId}/analyze`);
    return response.data;
}

export const getAnalyzeApi = async (analysisId)=>{
    const response = await api.get(`/api/analysis/${analysisId}`);
    return response.data;
}
