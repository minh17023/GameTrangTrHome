import React from 'react';
import { motion } from 'framer-motion';
import './index.css';

const DraggableItem = ({ icon, label, initialX, initialY, onClick }) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: initialX, y: initialY }}
      style={{ position: 'absolute', cursor: 'grab', zIndex: 10 }}
      whileTap={{ cursor: 'grabbing', scale: 0.9 }}
      whileHover={{ scale: 1.1, filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.8))' }}
      onClick={onClick}
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
