import api from "./Api"


export const processIncidentApi = async (projectId,rawLogs)=>{
    const response = await api.post(`/api/incidents/process`,{projectId,rawLogs});
    return response.data;
}

export const getAllIncidentApi = async (projectId)=>{
    const response = await api.get(`/api/incidents/${projectId}`);
    return response.data;
}

export const getIncidentApi = async (projectId,incidentId)=>{
    const response = await api.get(`/api/incidents/${projectId}/${incidentId}`);
    return response.data;
}

export const updateIncidentPutApi = async (projectId,incidentId,status)=>{
    const response = await api.put(`/api/incidents/${projectId}/${incidentId}`,{status});
    return response.data;
}

export const updateIncidentPatchApi = async (projectId,incidentId,status)=>{
    const response = await api.patch(`/api/incidents/${projectId}/${incidentId}`,{status});
    return response.data;
}



export const searchIncidentApi = async (projectId,query,limit = 5)=>{
    const response = await api.post(`/api/incidents/${projectId}/search`,{query,limit})
    return response.data;
}

