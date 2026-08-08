import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';
import MainRoom from './MainRoom';
import './index.css';
import './sparkle.css';

function App() {
  const [isEntered, setIsEntered] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  // Handle global click sparkles
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const newSparkle = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY
      };
      setSparkles(prev => [...prev, newSparkle].slice(-10)); // Keep max 10
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleEnter = () => {
    setIsEntered(true);
    // Play audio when user clicks
    const audio = document.getElementById('lofi-audio');
    if (audio) {
      audio.volume = 0.2; // Soft volume
      audio.play().catch(e => console.log('Audio autoplay blocked', e));
    }
  };

  return (
    <>
      {/* Render Sparkles */}
      {sparkles.map(sparkle => (
        <div 
          key={sparkle.id} 
          className="sparkle"
          style={{ left: sparkle.x - 10, top: sparkle.y - 10 }}
        >
          ✨
        </div>
      ))}

      {/* Main Content */}
      {!isEntered ? (
        <SplashScreen onEnter={handleEnter} />
      ) : (
        <MainRoom />
      )}
    </>
  );
}

export default App;
