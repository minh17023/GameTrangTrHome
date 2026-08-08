import { fetchApi } from './apiClient';

export const getPhoneMessages = () => fetchApi('/phone');

export const addPhoneMessage = (title, audio_url) => fetchApi('/phone', {
  method: 'POST',
  body: JSON.stringify({ title, audio_url }),
});

export const updatePhoneMessage = (id, title, audio_url) => fetchApi(`/phone/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ title, audio_url }),
});

export const deletePhoneMessage = (id) => fetchApi(`/phone/${id}`, {
  method: 'DELETE',
});
