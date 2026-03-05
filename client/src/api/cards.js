import api from './axios';

const cardAPI = {
  // Create a new card
  createCard: async (cardData) => {
    try {
      const response = await api.post('/cards', cardData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to create card');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Update a card
  updateCard: async (id, cardData) => {
    try {
      const response = await api.put(`/cards/${id}`, cardData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to update card');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Move a card to a different list
  moveCard: async (id, listId) => {
    try {
      const response = await api.put(`/cards/${id}`, { listId });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to move card');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Delete a card
  deleteCard: async (id) => {
    try {
      const response = await api.delete(`/cards/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to delete card');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  },

  // Get all cards for a specific list
  getCardsByList: async (listId) => {
    try {
      const response = await api.get(`/cards/list/${listId}`);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Failed to fetch cards');
      } else if (error.request) {
        throw new Error('Network error: Please check your connection');
      } else {
        throw new Error(error.message || 'An error occurred');
      }
    }
  }
};

export default cardAPI;