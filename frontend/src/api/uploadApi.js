import { fetchApi, API_URL } from './apiClient';

export const uploadFile = async (file, prefix = '') => {
  const formData = new FormData();
  formData.append('file', file);
  if (prefix) formData.append('prefix', prefix);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return response.json();
};
