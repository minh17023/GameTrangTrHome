import { fetchApi } from './apiClient';

export const getLetter = () => fetchApi('/letters');

export const updateLetter = (content) => fetchApi('/letters', {
  method: 'PUT',
  body: JSON.stringify({ content }),
});
