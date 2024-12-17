import axios from './axiosConfig';

const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          username: response.data.user.username,
          phoneNumber: response.data.user.phoneNumber
        };
        localStorage.setItem('user', JSON.stringify(userData));
        return response.data;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Authentication error occurred');
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  },

  signup: async (email, password) => {
    try {
      console.log('Attempting signup with:', email);
      const response = await axios.post('/api/auth/signup', { email, password });
      console.log('Signup response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error.response?.data || error);
      throw error.response?.data?.message || 'Registration failed';
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await axios.get(`/api/auth/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Email verification failed';
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await axios.post('/api/auth/resend-verification', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Failed to resend verification email';
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authService; 