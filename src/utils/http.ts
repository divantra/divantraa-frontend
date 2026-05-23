import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:5000/api', // Update this to your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach the Access Token to every outgoing request
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401 errors
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If unauthorized and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call the correct backend refresh endpoint
        // We don't need to pass the token in body because it's in a cookie, 
        // but we MUST use withCredentials: true so the browser sends it.
        const response = await axios.post(
          'http://localhost:5000/api/auth/refresh-token', 
          {}, 
          { withCredentials: true }
        );
        const { data } = response.data; // data contains { accessToken }
        const { accessToken } = data;

          localStorage.setItem('accessToken', accessToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return http(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default http;
