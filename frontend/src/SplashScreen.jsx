import { useState, useEffect } from 'react';
import './index.css';

const SplashScreen = ({ onEnter }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Generate falling blossoms/hearts
    const interval = setInterval(() => {
      const isHeart = Math.random() > 0.5;
      const left = Math.random() * 100;
      const duration = 5 + Math.random() * 5; // 5s to 10s
      const size = 10 + Math.random() * 20; // 10px to 30px
      
      setItems(prev => [...prev, {
        id: Date.now() + Math.random(),
        isHeart,
        left,
        duration,
        size
      }].slice(-50)); // Keep max 50 items to avoid lag
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="splash-container" onClick={onEnter}>
      {/* Hidden audio element for lofi music, requires interaction to play */}
      <audio id="lofi-audio" loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />
      
      <div className="welcome-text">
        welcome home, yn 🌸
        <div style={{ fontSize: '1rem', marginTop: '10px', textAlign: 'center', fontWeight: 'normal' }}>
          (click để vào phòng)
        </div>
      </div>
      
      {items.map(item => (
        <div 
          key={item.id} 
          className="falling-item"
          style={{
            left: `${item.left}vw`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}px`
          }}
        >
          {item.isHeart ? '💖' : '🌸'}
        </div>
      ))}
    </div>
  );
};

export default SplashScreen;
