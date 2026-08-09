import { fetchApi } from './apiClient';

export const getAllItems = () => fetchApi('/items');

export const updateItemPosition = (label, x, y) => fetchApi(`/items/${encodeURIComponent(label)}`, {
  method: 'PUT',
  body: JSON.stringify({ x, y }),
});
