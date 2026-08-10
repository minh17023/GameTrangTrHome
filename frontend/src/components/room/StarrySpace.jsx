import React, { useEffect, useRef, useState } from 'react';
import '../../assets/css/index.css';

const StarrySpace = ({ photos, onClose }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  // Lọc ra các ảnh yêu thích
  const favoritePhotos = photos.filter(p => p.is_favorite);

  // Hiệu ứng di chuyển chuột để xoay nhẹ không gian
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / innerWidth - 0.5) * 50; 
      const y = (e.clientY / innerHeight - 0.5) * 50; 
      setRotation({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Vẽ bầu trời sao tĩnh bằng Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const stars = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5,
        alpha: Math.random(),
        speed: Math.random() * 0.05
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.fill();

        // Lấp lánh
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) {
          star.speed = -star.speed;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#000', zIndex: 9999, overflow: 'hidden', perspective: '1000px'
    }}>
      {/* Background Canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />

      {/* Nút Đóng */}
      <button 
        onClick={onClose}
        style={{
          position: 'absolute', top: '20px', right: '20px', zIndex: 10001,
          padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white',
          border: '1px solid white', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
        }}
      >
        Trở Về Phòng
      </button>

      {/* Parallax Container cho các ngôi sao nổi bật */}
      <div 
        ref={containerRef}
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        }}
      >
        {favoritePhotos.map((photo, i) => {
          const rand1 = (photo.id.charCodeAt(0) % 100) / 100;
          const rand2 = (photo.id.charCodeAt(1) % 100) / 100;
          const rand3 = (photo.id.charCodeAt(2) % 100) / 100;

          // Tính toán vị trí cơ bản
          const top = 10 + rand1 * 80 + '%';
          const left = 10 + rand2 * 80 + '%';
          const depth = 0.2 + rand3 * 1.5; // Hệ số parallax cho từng ngôi sao

          // Vị trí dịch chuyển parallax
          const offsetX = rotation.x * depth;
          const offsetY = rotation.y * depth;

          return (
            <div 
              key={photo.id}
              onClick={() => setSelectedImage(photo.url)}
              style={{
                position: 'absolute',
                top, left,
                transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: '80px', height: '80px', // Vùng click đủ rộng
                zIndex: Math.floor(depth * 10)
              }}
              className="star-photo"
            >
              {/* Ngôi sao lấp lánh đẹp mắt */}
              <div className="glowing-star"></div>
              
              {/* Tooltip hiển thị ảnh khi hover */}
              <div className="photo-preview-tooltip">
                <img src={photo.url} alt="Kỷ niệm" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ảnh Chi Tiết */}
      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 10002, cursor: 'pointer'
          }}
        >
          <img 
            src={selectedImage} 
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '15px', boxShadow: '0 0 50px rgba(255,255,255,0.5)', border: '5px solid white' }}
            alt="Kỷ niệm"
          />
        </div>
      )}
      
      <style>{`
        .glowing-star {
          width: 15px; height: 15px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 40px #ff69b4, 0 0 80px #ff69b4;
          animation: pulse 3s infinite alternate;
          position: relative;
          transition: all 0.3s ease;
        }
        .glowing-star::before, .glowing-star::after {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 10px #fff, 0 0 20px #ff69b4;
          pointer-events: none;
        }
        .glowing-star::before { width: 1.5px; height: 60px; }
        .glowing-star::after { width: 60px; height: 1.5px; }

        @keyframes pulse {
          0% { transform: scale(0.8) rotate(0deg); opacity: 0.8; }
          100% { transform: scale(1.2) rotate(10deg); opacity: 1; }
        }

        .photo-preview-tooltip {
          position: absolute;
          bottom: -70px;
          opacity: 0;
          transform: translateY(10px) scale(0.8);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: none;
          z-index: 1000;
          background: rgba(255,255,255,0.2);
          padding: 5px;
          border-radius: 8px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255,255,255,0.4);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .photo-preview-tooltip img {
          width: 50px; height: 50px; object-fit: cover; border-radius: 4px;
        }

        .star-photo:hover .glowing-star {
          transform: scale(1.5) rotate(45deg);
          box-shadow: 0 0 20px #fff, 0 0 40px #fff, 0 0 60px #00ffff, 0 0 100px #00ffff;
        }
        .star-photo:hover .glowing-star::before, .star-photo:hover .glowing-star::after {
          box-shadow: 0 0 10px #fff, 0 0 20px #00ffff;
        }
        .star-photo:hover .photo-preview-tooltip {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </div>
  );
};

export default StarrySpace;
