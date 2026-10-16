import api from "./Api"



export const createProjectApi = async (ProjectDetails)=>{
    const response = await api.post("/api/projects",ProjectDetails)
    return response.data;
}

export const getProjectApi = async (ProjectId)=>{
    const response = await api.get(`/api/projects/${ProjectId}`)
    return response.data;
}

export const getAllProjectApi = async ()=>{
    const response = await api.get("/api/projects")
    return response.data;
}

export const updateProjectApi = async (ProjectId,UpdatedProjectDetails)=>{
    const response = await api.patch(`/api/projects/${ProjectId}`,UpdatedProjectDetails)
    return response.data;
}

export const deleteProjectApi = async (ProjectId)=>{
    const response = await api.delete(`/api/projects/${ProjectId}`)
    return response.data;
}