import { createSlice } from "@reduxjs/toolkit";



const initialState = {
    user:null,
    accessToken:null,
    isAuthenticated: false,
    isLoading: true,
    isError: null
};

const authSlice = createSlice(
    {
        name: "authLogin",
        initialState: initialState,
        reducers:
        {
            setAuthentication: (state,action)=>{
                state.user = action.payload.user,
                state.accessToken = action.payload.accessToken,
                state.isAuthenticated = true,
                state.isLoading = false,
                state.isError = null
            },

            logout:(state)=>{
                state.user = null,
                state.accessToken = null,
                state.isAuthenticated = false,
                state.isLoading = false,
                state.isError = null
            },
            setLoading:(state , action)=>{
                state.isLoading = action.payload
            },
            setError:(state,action)=>{
                state.isError = action.payload;
            },
            setAccessToken: (state,action)=>{
                state.accessToken = action.payload;
            },
            setUser: (state,action)=>{
                state.user = action.payload;
            }

        }
    }
);

export const {setAuthentication,logout,setLoading,setError,setAccessToken,setUser} = authSlice.actions;
export default authSlice.reducer;
