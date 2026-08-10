import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../assets/css/index.css';

const HelloKittyNPC = ({ targetObject, onTargetReached }) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isSleeping, setIsSleeping] = useState(false);
  const [message, setMessage] = useState('');

  // AFK Logic
  useEffect(() => {
    let afkTimer;
    
    const resetTimer = () => {
      setIsSleeping(false);
      setMessage('');
      clearTimeout(afkTimer);
      // 15 seconds for testing (15 * 60 * 1000 for 15 mins)
      afkTimer = setTimeout(() => {
        setIsSleeping(true);
      }, 15000); 
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      clearTimeout(afkTimer);
    };
  }, []);

  // Guide Logic
  useEffect(() => {
    if (targetObject) {
      setIsSleeping(false);
      setMessage("Meow! Có đồ mới kìa, đi theo bé nha~");
      
      // Move to target
      setTimeout(() => {
        setPosition({ x: targetObject.x, y: targetObject.y - 100 });
        
        // Clear message after reaching
        setTimeout(() => {
          setMessage('');
          if (onTargetReached) onTargetReached();
        }, 3000);
      }, 1000);
    }
  }, [targetObject]);

  return (
    <motion.div
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 50, damping: 20 }}
      style={{
        position: 'absolute',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              background: 'white',
              padding: '8px 12px',
              borderRadius: '15px',
              border: '2px solid var(--pastel-pink)',
              marginBottom: '10px',
              fontWeight: 'bold',
              color: 'var(--text-dark)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div style={{ fontSize: '4rem', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))' }}>
        {isSleeping ? '💤🐱' : '🐱'}
      </div>
      
      {isSleeping && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '-10px',
          fontSize: '3rem',
          transform: 'rotate(-20deg)'
        }}>
          🛌
        </div>
      )}
    </motion.div>
  );
};

export default HelloKittyNPC;
