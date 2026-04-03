// src/auth.js - Authentication helpers (localStorage-based)

/**
 * Save auth data after login
 * @param {Object} data - Response from login API: { token, user }
 */
export const saveAuth = (data) => {
  if (data?.token) {
    localStorage.setItem('token', data.token);
  }
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
};

/**
 * Get current user object from localStorage
 * @returns {Object|null} User object or null if not logged in
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Get raw JWT token string
 * @returns {string|null} Token or null
 */
export const getToken = () => localStorage.getItem('token');

/**
 * Clear all auth data (logout)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Check if user is authenticated (has token)
 * @returns {boolean}
 */
export const isAuthenticated = () => !!getToken();

/**
 * Check if current user has one of the required roles
 * @param  {...string} roles - Roles to check against (e.g., 'admin', 'owner')
 * @returns {boolean}
 */
export const hasRole = (...roles) => {
  const user = getUser();
  return user?.role && roles.includes(user.role);
};

/**
 * Get Authorization header value for API requests
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};