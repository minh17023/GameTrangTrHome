export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API call failed: ${response.statusText}`);
  }
  
  return data;
};
