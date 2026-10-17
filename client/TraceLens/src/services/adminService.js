import api from "./Api";

export const getAdminOverviewApi = async () => {
    const response = await api.get("/api/admin/overview");
    return response.data;
};

export const getAdminUserIncidentsApi = async (userId, params = {}) => {
    const response = await api.get(`/api/admin/users/${userId}/incidents`, { params });
    return response.data;
};

export const getAdminIncidentAnalysesApi = async (userId, incidentId) => {
    const response = await api.get(`/api/admin/users/${userId}/incidents/${incidentId}/analyses`);
    return response.data;
};

export const updateAdminIncidentApi = async (userId, incidentId, status) => {
    const response = await api.patch(`/api/admin/users/${userId}/incidents/${incidentId}`, { status });
    return response.data;
};

export const deleteAdminIncidentApi = async (userId, incidentId) => {
    const response = await api.delete(`/api/admin/users/${userId}/incidents/${incidentId}`);
    return response.data;
};
