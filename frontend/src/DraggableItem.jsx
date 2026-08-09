import React, { useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { updateItemPosition } from './api/itemApi';
import { socket } from './socket';
import './index.css';

const DraggableItem = ({ icon, label, initialX, initialY, dbPosition, onClick }) => {
  const storageKey = `pos_${label}`;
  
  let startX = initialX;
  let startY = initialY;
  
  // 1. Prefer database position if available
  if (dbPosition) {
    startX = dbPosition.x;
    startY = dbPosition.y;
  } else {
    // 2. Fallback to local storage
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        startX = parsed.x;
        startY = parsed.y;
      } catch(e) {}
    }
  }
  
  const x = useMotionValue(startX);
  const y = useMotionValue(startY);

  // Lắng nghe tín hiệu Real-time từ các client khác
  useEffect(() => {
    const handleItemMoved = (data) => {
      if (data.label === label) {
        x.set(data.x);
        y.set(data.y);
      }
    };

    socket.on('item_moved', handleItemMoved);
    return () => {
      socket.off('item_moved', handleItemMoved);
    };
  }, [label, x, y]);

  // Đồng bộ ban đầu nếu fetch data về trễ
  useEffect(() => {
    if (dbPosition) {
      x.set(dbPosition.x);
      y.set(dbPosition.y);
    }
  }, [dbPosition, x, y]);

  const handleDrag = (event, info) => {
    // Phát chùm sự kiện đang kéo qua Socket.IO
    socket.emit('item_dragging', { label, x: x.get(), y: y.get() });
  };

  const handleDragEnd = async () => {
    const finalX = x.get();
    const finalY = y.get();
    
    // Lưu tạm máy mình
    localStorage.setItem(storageKey, JSON.stringify({ x: finalX, y: finalY }));
    
    // Bắn một lần cuối qua socket
    socket.emit('item_dragging', { label, x: finalX, y: finalY });
    
    // Lưu cứng lên Database
    try {
      await updateItemPosition(label, finalX, finalY);
    } catch (e) {
      console.log("Không thể lưu vị trí lên Server", e);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      style={{ x, y, position: 'absolute', cursor: 'grab', zIndex: 10 }}
      whileTap={{ cursor: 'grabbing', scale: 0.9 }}
      whileHover={{ scale: 1.1, filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.8))' }}
      onClick={onClick}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="draggable-item-2d"
    >
      <div className="item-icon-2d" style={{ fontSize: '4rem' }}>
        {icon}
      </div>
      <div className="item-label-2d">{label}</div>
    </motion.div>
  );
};

export default DraggableItem;
