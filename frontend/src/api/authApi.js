import axios from 'axios';
import { API_URL } from './apiClient';

export const getPartner = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_URL}/auth/partner`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data.partner;
};

export const unpair = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.post(`${API_URL}/auth/unpair`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data;
};

export const verifyOTP = async (email, code) => {
  const { data } = await axios.post(`${API_URL}/auth/verify-otp`, { email, code });
  return data;
};

export const getPairRequests = async () => {
  const token = localStorage.getItem('token');
  const { data } = await axios.get(`${API_URL}/auth/pair-requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data.requests;
};

export const acceptPairRequest = async (requestId) => {
  const token = localStorage.getItem('token');
  const { data } = await axios.post(`${API_URL}/auth/accept-pair`, { requestId }, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data;
};

export const sendPasswordResetOTP = async (email) => {
  const { data } = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return data;
};

export const resetPassword = async (email, code, newPassword) => {
  const { data } = await axios.post(`${API_URL}/auth/reset-password`, { email, code, newPassword });
  return data;
};

export const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  const { data } = await axios.put(`${API_URL}/auth/me`, profileData, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data;
};
