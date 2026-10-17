import api from "./Api";

// 1. Trigger Incident Analysis
export const analyzeIncidentApi = async (projectId, incidentId) => {
  try {
    const response = await api.post(
      `/api/analysis/projects/${projectId}/incidents/${incidentId}/analyze`
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Failed to complete incident analysis.";
    
    // Throw readable error so UI component can catch it
    throw new Error(message);
  }
};

// 2. Get All Analyses for an Incident
export const getAllAnalyzeApi = async (projectId, incidentId) => {
  try {
    const response = await api.get(
      `/api/analysis/projects/${projectId}/incidents/${incidentId}/analyze`
    );
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch incident analyses.";
    throw new Error(message);
  }
};

// 3. Get Single Analysis Details
export const getAnalyzeApi = async (analysisId) => {
  try {
    const response = await api.get(`/api/analysis/${analysisId}`);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to fetch analysis details.";
    throw new Error(message);
  }
};