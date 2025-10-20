module.exports = {
  getAuthService: () => ({
    isAuthenticated: () => false,
    getStoredUser: () => null,
    getCurrentUser: async () => null,
    login: async () => ({ user: null }),
    register: async () => ({ user: null }),
    logout: async () => undefined,
    refreshUser: async () => null,
  }),
};


