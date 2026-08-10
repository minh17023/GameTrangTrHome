import axios from 'axios';
import { API_URL } from './apiClient';

export const getMessages = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_URL}/messages`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data.messages;
};

export const sendMessage = async (type, content) => {
  const token = localStorage.getItem('token');
  const { data } = await axios.post(`${API_URL}/messages`, { type, content }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data.message;
};
