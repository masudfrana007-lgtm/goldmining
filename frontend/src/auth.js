// frontend/src/auth.js

// Save token + user after successful login
export const saveAuth = (data) => {
  if (data?.token) {
    localStorage.setItem('token', data.token);
  }
  if (data?.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
};

// Get current user object (parsed from JSON)
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Get raw token string
export const getToken = () => localStorage.getItem('token');

// Clear all auth data (logout)
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Check if user is logged in
export const isAuthenticated = () => !!getToken();

// Check if user has one of the required roles
export const hasRole = (...roles) => {
  const user = getCurrentUser();
  return user?.role && roles.includes(user.role);
};