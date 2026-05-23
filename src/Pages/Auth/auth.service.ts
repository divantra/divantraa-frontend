import http from '../../utils/http';

export const authService = {
  /**
   * Register a new user
   */
  register: async (userData: any) => {
    const { data } = await http.post('/v1/auth/register', userData);
    return data.success && data?.data ? data?.data : data;
  },
  /**
   * Verify OTP
   */
  verifyOTP: async (userData: any) => {
    const { data } = await http.post('/v1/auth/verify-otp', userData);
    return data.success && data?.data ? data?.data : data;
  },

  /**
   * Log in and store tokens securely
   */
  verifyLoginOTP: async (credentials: any) => {
    const { data: apiResponse } = await http.post('/v1/auth/login', credentials);
    const { data } = apiResponse;
    if (data?.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return apiResponse;
  },

  /**
   * Log in and store tokens securely
   */
  loginWithOTP: async (credentials: any) => {
    const { data: apiResponse } = await http.post('/v1/auth/login-with-otp', credentials);
    return apiResponse.success && apiResponse?.data ? apiResponse?.data : apiResponse;
  },

  /**
   * Request an OTP for password reset
   */
  forgotPassword: async (identifier: string) => {
    const { data } = await http.post('/v1/auth/forgot-password', { identifier });
    return data.success && data?.data ? data?.data : data;
  },

  /**
   * Reset password using the received OTP
   */
  resetPassword: async (resetData: any) => {
    const { data } = await http.post('/v1/auth/reset-password', resetData);
    return data.success && data?.data ? data?.data : data;
  },

  // Returns: true if available, false if taken
  checkUserId: async (userData: any) => {
    const { data } = await http.get(`/v1/auth/${userData.userId}/check-user-id`, 
      { params: {
        code: userData.code, 
      } 
    });
    return data.success && data?.data ? data?.data : data;
  },
  
  // Saves the chosen User ID (only if unique — backend must re-validate)
  updateUserId: async (userData: any) => {
    const { data } = await http.post(`/v1/auth/${userData.userId}/update-user-id`, userData);
    return data.success && data?.data ? data?.data : data;
  },

  // Send Relogin Otp
  reSendOTP: async (userData: any) => {
    const { data } = await http.post(`/v1/auth/send-otp`, userData);
    return data.success && data?.data ? data?.data : data;
  },

  /**
   * Log out and clear local storage
   */
  logout: async () => {
    try {
      await http.post('/v1/auth/logout');
    } finally {
      localStorage.clear();
      window.location.href = '/login';
    }
  }
};
