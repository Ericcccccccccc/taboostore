// API Client for Taboo Store Backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Base fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse and return JSON response
    return await response.json();
  } catch (error) {
    // Re-throw network errors or parsing errors
    if (error instanceof TypeError) {
      throw new Error(`Network error: Unable to connect to ${url}`);
    }
    throw error;
  }
}

/**
 * API Client Object
 */
export const api = {
  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status
   */
  checkHealth: async () => {
    return fetchAPI('/api/health');
  },

  /**
   * Get cards for a specific language
   * @param {string} language - Language code ('en', 'pt', or 'both')
   * @returns {Promise<Object>} Cards data
   */
  getCards: async (language = 'en') => {
    return fetchAPI(`/api/cards?language=${language}`);
  },

  /**
   * Get available languages
   * @returns {Promise<Array>} List of available languages
   */
  getLanguages: async () => {
    return fetchAPI('/api/languages');
  },
};

export default api;
