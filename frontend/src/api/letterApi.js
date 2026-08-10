import { fetchApi } from './apiClient';

export const getLetters = () => fetchApi('/letters');

export const createLetter = (content) => fetchApi('/letters', {
  method: 'POST',
  body: JSON.stringify({ content }),
});

export const markLetterAsRead = (id) => fetchApi(`/letters/${id}/read`, {
  method: 'PUT',
});
