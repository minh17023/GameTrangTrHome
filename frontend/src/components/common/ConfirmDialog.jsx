import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Xóa', cancelText = 'Hủy' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', maxWidth: '90%', width: '350px' }}
          >
            <h3 style={{ margin: '0 0 15px 0', color: '#ff6b81' }}>{title}</h3>
            <p style={{ margin: '0 0 25px 0', color: '#333' }}>{message}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button 
                onClick={onCancel} 
                style={{ flex: 1, padding: '10px 15px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {cancelText}
              </button>
              <button 
                onClick={onConfirm} 
                style={{ flex: 1, padding: '10px 15px', background: '#ff7675', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
