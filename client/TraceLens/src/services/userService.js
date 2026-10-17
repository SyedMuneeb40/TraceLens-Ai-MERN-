import api from "./Api";

export const getCurrentUserApi = async ()=>{
    const response = await api.get("/api/users/me");
    return response.data;
};

export const updateCurrentUserApi = async (data)=>{
    const response = await api.patch("/api/users/me",data);
    return response.data;
};

export const changeCurrentPasswordApi = async (data)=>{
    const response = await api.post("/api/auth/password/update",data);
    return response.data;
};

export const requestPasswordOtpApi = async (data)=>{
    const response = await api.post("/api/auth/password/otp",data);
    return response.data;
};

export const getUsersApi = async (params = {})=>{
    const response = await api.get("/api/users",{params});
    return response.data;
};

export const updateUserApi = async (userId,data)=>{
    const response = await api.patch(`/api/users/${userId}`,data);
    return response.data;
};

export const resetUserPasswordApi = async (userId,newPassword)=>{
    const response = await api.patch(`/api/users/${userId}/password`,{newPassword});
    return response.data;
};

export const deleteUserApi = async (userId)=>{
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
};

export const createAdminApi = async (data)=>{
    const response = await api.post("/api/users/admins",data);
    return response.data;
};
