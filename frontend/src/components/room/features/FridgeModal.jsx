import React, { useState } from 'react';
import Modal from '../../common/Modal';
import ConfirmDialog from '../../common/ConfirmDialog';
import { addFridgeItem, updateFridgeItem, deleteFridgeItem } from '../../../api/fridgeApi';

const FridgeModal = ({ isOpen, onClose, fridgeItems, setFridgeItems, user, socket }) => {
  const [newFood, setNewFood] = useState("");
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleAddFood = async () => {
    if (!newFood.trim()) return;
    try {
      const added = await addFridgeItem(newFood);
      if (added) {
        setFridgeItems([...fridgeItems, added]);
        socket.emit('data_changed', { type: 'fridge', roomId: user.room_id });
      }
      setNewFood("");
    } catch (err) {}
  };

  const handleEditFood = async (item) => {
    const newName = prompt("Nhập tên món ăn mới:", item.name);
    if (newName && newName.trim() !== "") {
      const updated = await updateFridgeItem(item.id, newName);
      setFridgeItems(fridgeItems.map(f => f.id === item.id ? updated : f));
      socket.emit('data_changed', { type: 'fridge', roomId: user.room_id });
    }
  };

  const handleDeleteFood = async () => {
    if (!itemToDelete) return;
    await deleteFridgeItem(itemToDelete);
    setFridgeItems(fridgeItems.filter(f => f.id !== itemToDelete));
    setItemToDelete(null);
    socket.emit('data_changed', { type: 'fridge', roomId: user.room_id });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧊 Hôm nay ăn gì?">
      <div>
        {fridgeItems.map((item, index) => (
          <span key={index} className="fridge-item">
            {item.name}
            <button className="action-btn" onClick={() => handleEditFood(item)}>✏️</button>
            <button className="action-btn" onClick={() => setItemToDelete(item.id)}>❌</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <input 
          type="text" 
          placeholder="Thêm món mới..." 
          value={newFood} 
          onChange={(e) => setNewFood(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleAddFood()} 
          style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc', flex: 1 }} 
        />
        <button onClick={handleAddFood} style={{ padding: '8px 15px', background: 'var(--pastel-pink-dark)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Thêm</button>
      </div>
      <ConfirmDialog 
        isOpen={!!itemToDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc muốn xóa món ăn này không?"
        onConfirm={handleDeleteFood}
        onCancel={() => setItemToDelete(null)}
      />
    </Modal>
  );
};

export default FridgeModal;
