import { AsyncLocalStorage } from 'async_hooks';

export const context = new AsyncLocalStorage();

export const getRoomId = () => {
  const store = context.getStore();
  if (!store || !store.roomId) {
    throw new Error("Bạn chưa ghép đôi (Pair) hoặc chưa có phòng, không thể thực hiện thao tác này!");
  }
  return store.roomId;
};
