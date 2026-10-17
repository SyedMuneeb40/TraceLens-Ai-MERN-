import api from "./Api"



//this api is also just fron admin to get all audit logs
export const getAuditLogsApi = async (params = {})=>{
    const response = await api.get(`/api/audit-logs`,{params});
    return response.data;
}
