import { fetchApi } from './apiClient';

export const getPet = async () => {
  const data = await fetchApi('/pets');
  return data.pet;
};

export const adoptPet = async (type, name) => {
  const data = await fetchApi('/pets/adopt', {
    method: 'POST',
    body: JSON.stringify({ type, name })
  });
  return data.pet;
};

export const interactPet = async (action) => {
  const data = await fetchApi('/pets/interact', {
    method: 'POST',
    body: JSON.stringify({ action })
  });
  return data.pet;
};

export const recoverStreak = async () => {
  const data = await fetchApi('/pets/recover', {
    method: 'POST'
  });
  return data.pet;
};

export const toggleSleep = async (isSleeping) => {
  const data = await fetchApi('/pets/sleep', {
    method: 'POST',
    body: JSON.stringify({ isSleeping })
  });
  return data.pet;
};

export const equipAccessory = async (accessoryId) => {
  const data = await fetchApi('/pets/equip', {
    method: 'POST',
    body: JSON.stringify({ accessoryId })
  });
  return data.pet;
};
