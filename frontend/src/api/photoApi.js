import { fetchApi } from './apiClient';

export const getPhotos = () => fetchApi('/photos');

export const createPhoto = (url) => fetchApi('/photos', {
  method: 'POST',
  body: JSON.stringify({ url }),
});

export const toggleFavoritePhoto = (id) => fetchApi(`/photos/${id}/favorite`, {
  method: 'PUT',
});

export const deletePhoto = (id) => fetchApi(`/photos/${id}`, {
  method: 'DELETE',
});
