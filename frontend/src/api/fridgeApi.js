import { fetchApi } from './apiClient';

export const getFridgeItems = () => fetchApi('/fridge');

export const addFridgeItem = (name) => fetchApi('/fridge', {
  method: 'POST',
  body: JSON.stringify({ name }),
});

export const updateFridgeItem = (id, name) => fetchApi(`/fridge/${id}`, {
  method: 'PUT',
  body: JSON.stringify({ name }),
});

export const deleteFridgeItem = (id) => fetchApi(`/fridge/${id}`, {
  method: 'DELETE',
});
