import api from './axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const listAPI = {
  // Create a new list
  createList: async (listData) => {
    try {
      const response = await api.post('/lists', listData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create list');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Update a list
  updateList: async (id, listData) => {
    try {
      const response = await api.put(`/lists/${id}`, listData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update list');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Delete a list
  deleteList: async (id) => {
    try {
      const response = await api.delete(`/lists/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete list');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Get all lists for a specific board
  getListsByBoard: async (boardId) => {
    try {
      const response = await api.get(`/lists/board/${boardId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch lists');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Get all lists and cards for a specific board
  getListsByBoardWithCards: async (boardId) => {
    try {
      const response = await api.get(`/lists/board/${boardId}/with-cards`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch lists with cards');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  }
};

export default listAPI;