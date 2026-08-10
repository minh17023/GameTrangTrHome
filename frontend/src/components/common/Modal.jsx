import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../assets/css/index.css';

const Modal = ({ isOpen, onClose, title, width, children, darkTheme }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: width || '450px', 
              maxWidth: '90vw',
              background: darkTheme ? '#141414' : 'white',
              padding: darkTheme ? '0' : undefined,
              border: darkTheme ? '1px solid #333' : undefined,
              overflow: darkTheme ? 'hidden' : undefined
            }}
          >
            {!darkTheme && (
              <div className="modal-header">
                <h2 className="modal-title">{title}</h2>
                <button className="modal-close" onClick={onClose}>✖</button>
              </div>
            )}
            <div className="modal-body" style={{ padding: darkTheme ? '0' : undefined }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
