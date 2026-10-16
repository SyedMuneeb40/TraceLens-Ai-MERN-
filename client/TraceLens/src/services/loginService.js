import api from "./Api.js";

export const loginUserApi = async (credentials)=>{
    const response = await api.post(`/api/auth/login`,credentials);
    return response.data;
}


export const logoutUserApi = async ()=>{
    const response = await api.post(`/api/auth/logout`);
    return response.data;
}

export const logoutUserFromAllSessionApi = async ()=>{
    const response = await api.post(`/api/auth/logout-all`);
    return response.data;
};

export const registerUserApi = async (credentials)=>{
    const response = await api.post(`/api/auth/register`,credentials);
    return response.data;
}

export const meApi = async ()=>{
    const response = await api.get(`/api/auth/me`);
    return response.data;
}


