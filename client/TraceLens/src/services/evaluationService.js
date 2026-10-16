import api from "./Api"


//this api get al evaluation analyses report to page for only admin
export const getEvaluationApi = async ()=>{
    const response = await api.get(`/api/evaluations`);
    return response.data;
}

