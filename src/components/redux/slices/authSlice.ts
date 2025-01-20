import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const LOGIN_URL = 'https://api.orsetto.ch/api/customer/login';
const REGISTER_URL = 'https://api.orsetto.ch/api/customer/register';
const VERIFY_OTP_URL = 'https://api.orsetto.ch/api/customer/otp-validation-email';

const handleApiError = (error: any) => {
    if (error.response) {
        if (error.response.data?.errors) {
            return error.response.data.errors;
        }
        if (error.response.data?.message) {
            return error.response.data.message;
        }
        return error.response.data;
    }
    return 'An unexpected error occurred';
};

// Login Thunk
export const login = createAsyncThunk(
    'auth/login',
    async ({ emailId, password }: { emailId: string; password: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(LOGIN_URL, {
                emailId,
                password,
            });
            // Token başarılı şekilde döndüyse AsyncStorage'a kaydedelim
            await AsyncStorage.setItem('token', response.data.data.token);
            return response.data.data;
        } catch (error: any) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

// Register Thunk
export const register = createAsyncThunk(
    'auth/register',
    async (
        { emailId, password, isAcceptedTermAndConditions }:
        { emailId: string; password: string; isAcceptedTermAndConditions: boolean },
        { rejectWithValue }
    ) => {
        try {
            const response = await axios.post(REGISTER_URL, {
                emailId,
                password,
                isAcceptedTermAndConditions,
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

// Verify OTP Thunk
export const verifyOtp = createAsyncThunk(
    'auth/verifyOtp',
    async ({ emailId, otp }: { emailId: string; otp: string }, { rejectWithValue }) => {
        try {
            const requestBody = {
                emailId,
                otp: parseInt(otp, 10),
            };
            const response = await axios.post(VERIFY_OTP_URL, requestBody);
            if (response.data.status === 1) {
                return {
                    token: 'verified',
                    user: { emailId },
                };
            }
            return rejectWithValue('Verification failed. Please try again.');
        } catch (error: any) {
            return rejectWithValue(handleApiError(error));
        }
    }
);

// authSlice
const authSlice = createSlice({
    name: 'auth',
    initialState: {
        token: null,
        user: null,
        loading: false,
        error: null,
        pendingVerification: false,
        pendingEmail: null,
    },
    reducers: {
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.error = null;
            state.pendingVerification = false;
            state.pendingEmail = null;
        },

        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
                state.pendingVerification = false;
                state.pendingEmail = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.loading = false;
                state.pendingVerification = true;
                state.pendingEmail = action.meta.arg.emailId;
                state.error = null;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(verifyOtp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(verifyOtp.fulfilled, (state, action) => {
                state.loading = false;
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.pendingVerification = false;
                state.pendingEmail = null;
                state.error = null;
            })
            .addCase(verifyOtp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { logout, clearError } = authSlice.actions;

export default authSlice.reducer;
