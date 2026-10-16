import axios from "axios";
import store from "../store/store";
import { logout , setAccessToken } from "../store/authSlice";


const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true
});

let refreshTokenPromise = null;

api.interceptors.request.use(
    (config)=>{
        
        const state = store.getState();
        const AccessToken = state.auth.accessToken;

        if(AccessToken){
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${AccessToken}`
        };

        return config;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response)=>{
        return response;
    },
    async (error)=>{

        const orignalRequest = error.config;

        if(error.response && error.response.status === 401 && orignalRequest && !orignalRequest._retry && !orignalRequest.url.includes(`/auth/login`) && !orignalRequest.url.includes("/auth/refresh")){

            orignalRequest._retry = true;
            try{
                if(!refreshTokenPromise){
                    refreshTokenPromise = axios.get(`${import.meta.env.VITE_API_URL}/api/auth/refresh`,{withCredentials:true})
                    .finally(()=> refreshTokenPromise = null);
                }

                const refreshResponse = await refreshTokenPromise;
                const accessToken = refreshResponse.data?.accessToken;

                if (!accessToken) {
                    throw new Error("No access token received");
                }

                store.dispatch(setAccessToken(accessToken))

                orignalRequest.headers.Authorization = `Bearer ${accessToken}`

                return api(orignalRequest);

            }catch(refreshError){
                store.dispatch(logout())
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
);


export default api;