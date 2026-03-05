import api from './axios';

const boardAPI = {
  // Create a new board
  createBoard: async (title) => {
    try {
      const response = await api.post('/boards', { title });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error creating board' };
    }
  },

  // Get all boards for the logged-in user
  getBoards: async () => {
    try {
      const response = await api.get('/boards');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching boards' };
    }
  },

  // Update a board
  updateBoard: async (id, title) => {
    try {
      const response = await api.put(`/boards/${id}`, { title });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error updating board' };
    }
  },

  // Delete a board
  deleteBoard: async (id) => {
    try {
      const response = await api.delete(`/boards/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error deleting board' };
    }
  },

  // Get dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/boards/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Error fetching dashboard stats' };
    }
  },
};

export default boardAPI;