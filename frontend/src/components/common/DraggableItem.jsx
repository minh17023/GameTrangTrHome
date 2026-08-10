import React, { useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { updateItemPosition } from '../../api/itemApi';
import { socket } from '../../utils/socket';
import '../../assets/css/index.css';

const DraggableItem = ({ id, icon, label, initialX, initialY, dbPosition, onClick, onDragStart, roomId, blendMode }) => {
  const itemKey = id || label;
  const storageKey = `pos_${itemKey}`;
  const isDragging = React.useRef(false);
  
  // Convert absolute pixels to percentage if it's old data
  const parseCoord = (val, max, isX) => {
    if (val == null) return val;
    // If it's already a percentage (0.0 -> 1.0)
    if (val <= 1.2 && val >= -0.2) return val * max;
    // If it's old pixel data, assume old screen was 1200x800
    return (val / (isX ? 1200 : 800)) * max;
  };

  let startX = parseCoord(initialX, window.innerWidth, true);
  let startY = parseCoord(initialY, window.innerHeight, false);
  
  if (dbPosition) {
    startX = parseCoord(dbPosition.x, window.innerWidth, true);
    startY = parseCoord(dbPosition.y, window.innerHeight, false);
  } else {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        startX = parseCoord(parsed.x, window.innerWidth, true);
        startY = parseCoord(parsed.y, window.innerHeight, false);
      } catch(e) {}
    }
  }
  
  const x = useMotionValue(startX);
  const y = useMotionValue(startY);

  // Resize handler to keep items in relative positions
  useEffect(() => {
    const handleResize = () => {
      // Only adjust if we have a valid previous width
      const curX = x.get();
      const curY = y.get();
      // Estimate percentage from current window sizes
      // This is an approximation since window is resizing, but it keeps things fluid
      const pctX = curX / window.innerWidth;
      const pctY = curY / window.innerHeight;
      x.set(pctX * window.innerWidth);
      y.set(pctY * window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [x, y]);

  useEffect(() => {
    const handleItemMoved = (data) => {
      if (data.label === itemKey) {
        x.set(parseCoord(data.x, window.innerWidth, true));
        y.set(parseCoord(data.y, window.innerHeight, false));
      }
    };

    socket.on('item_moved', handleItemMoved);
    return () => {
      socket.off('item_moved', handleItemMoved);
    };
  }, [label, x, y]);

  useEffect(() => {
    if (dbPosition) {
      x.set(parseCoord(dbPosition.x, window.innerWidth, true));
      y.set(parseCoord(dbPosition.y, window.innerHeight, false));
    }
  }, [dbPosition, x, y]);

  const handleDrag = (event, info) => {
    const pctX = x.get() / window.innerWidth;
    const pctY = y.get() / window.innerHeight;
    socket.emit('item_dragging', { label: itemKey, x: pctX, y: pctY, roomId });
  };

  const handleDragStart = (e, info) => {
    isDragging.current = true;
    if (onDragStart) onDragStart(e, info);
  };

  const handleDragEnd = async () => {
    setTimeout(() => {
      isDragging.current = false;
    }, 150);

    const pctX = x.get() / window.innerWidth;
    const pctY = y.get() / window.innerHeight;
    
    localStorage.setItem(storageKey, JSON.stringify({ x: pctX, y: pctY }));
    socket.emit('item_dragging', { label: itemKey, x: pctX, y: pctY, roomId });

    
    try {
      await updateItemPosition(itemKey, pctX, pctY);
    } catch (e) {
      console.log("Không thể lưu vị trí lên Server", e);
    }
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={{ left: 0, top: 0, right: window.innerWidth - 80, bottom: window.innerHeight - 80 }}
      style={{ x, y, position: 'absolute', cursor: 'grab', zIndex: 10, mixBlendMode: blendMode || 'normal' }}
      whileTap={{ cursor: 'grabbing', scale: 0.9 }}
      whileHover={{ scale: 1.1, filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.8))' }}
      onClick={(e) => {
        if (isDragging.current) {
          e.stopPropagation();
          return;
        }
        if (onClick) onClick(e);
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className="draggable-item-2d"
    >
      <div className="item-icon-2d" style={{ fontSize: '4rem', pointerEvents: 'none' }}>
        {icon}
      </div>
    </motion.div>
  );
};

export default DraggableItem;
