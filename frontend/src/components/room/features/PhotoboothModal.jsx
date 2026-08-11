import React, { useState, useEffect, useRef } from 'react';
import Modal from '../../common/Modal';
import { toast } from 'react-hot-toast';
import { uploadFile } from '../../../api/uploadApi';
import { createPhoto } from '../../../api/photoApi';

const FRAMES = [
  { id: 'pink', name: 'Kitty Pink', color: '#ffb6c1', border: '#ff69b4', decoration: '🎀' },
  { id: 'blue', name: 'Cinnamoroll Blue', color: '#aec6cf', border: '#87ceeb', decoration: '☁️' },
  { id: 'black', name: 'Kuromi Black', color: '#333', border: '#000', decoration: '💀' },
  { id: 'sparkle', name: 'Anime Sparkle', color: '#f5f5dc', border: '#ffd700', decoration: '✨' },
];

const LAYOUTS = [
  { id: 'strip-4', name: 'Dải 4 ảnh', slots: 4 },
  { id: 'grid-2x2', name: 'Lưới 2x2', slots: 4 },
  { id: 'strip-3', name: 'Dải 3 ảnh', slots: 3 },
  { id: 'single', name: 'Ảnh Đơn', slots: 1 },
];

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const PhotoboothModal = ({ isOpen, onClose, user, socket }) => {
  const [step, setStep] = useState('capture');
  const [stream, setStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [flash, setFlash] = useState(false);
  const [isCoupleMode, setIsCoupleMode] = useState(false);
  const [captureSequenceRunning, setCaptureSequenceRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Editor state
  const [selectedFrame, setSelectedFrame] = useState(FRAMES[0]);
  const [selectedLayout, setSelectedLayout] = useState(LAYOUTS[0]);
  const [slots, setSlots] = useState(new Array(LAYOUTS[0].slots).fill(null));
  
  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const exportCanvasRef = useRef(null);
  const isMounted = useRef(true);
  const peerConnection = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    if (isOpen && step === 'capture') {
      startCamera();
    }
    return () => {
      isMounted.current = false;
      stopCamera();
      endCall();
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, step]);

  useEffect(() => {
    if (!socket) return;
    
    const handleRemoteCapture = (data) => {
      if (data.photo) {
        setCapturedPhotos(prev => [...prev, data.photo]);
        toast.success(`${data.userName} vừa chụp!`, { icon: '📸' });
      }
    };
    
    const handleSyncCountdown = (data) => {
      if (!isCoupleMode) return;
      if (data.count !== undefined) {
        setCountdown(data.count);
        if (data.count === 0) {
          executeCapture(true);
        }
      }
    };

    const handleCallIncoming = async (data) => {
      const { offer } = data;
      if (!isCoupleMode) setIsCoupleMode(true);
      
      const pc = createPeerConnection();
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('photobooth_answer', { roomId: user?.room_id, answer });
        toast.success("Đã kết nối camera với người yêu!");
      } catch (err) {
        console.error("Lỗi khi trả lời cuộc gọi WebRTC", err);
      }
    };

    const handleCallAnswered = async (data) => {
      const { answer } = data;
      if (peerConnection.current) {
        try {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
          toast.success("Đã kết nối camera với người yêu!");
        } catch (err) {
          console.error("Lỗi khi nhận answer WebRTC", err);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      const { candidate } = data;
      if (peerConnection.current) {
        try {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Lỗi khi add ICE candidate", e);
        }
      }
    };

    const handleCallEnded = () => {
      endCall();
      setIsCoupleMode(false);
      toast("Người yêu đã ngắt kết nối Camera.", { icon: '📴' });
    };

    socket.on('photobooth_photo', handleRemoteCapture);
    socket.on('photobooth_countdown', handleSyncCountdown);
    socket.on('photobooth_call', handleCallIncoming);
    socket.on('photobooth_answer', handleCallAnswered);
    socket.on('photobooth_ice', handleIceCandidate);
    socket.on('photobooth_end', handleCallEnded);

    return () => {
      socket.off('photobooth_photo', handleRemoteCapture);
      socket.off('photobooth_countdown', handleSyncCountdown);
      socket.off('photobooth_call', handleCallIncoming);
      socket.off('photobooth_answer', handleCallAnswered);
      socket.off('photobooth_ice', handleIceCandidate);
      socket.off('photobooth_end', handleCallEnded);
    };
  }, [socket, stream, isCoupleMode]); 

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Lỗi camera:", err);
      toast.error("Không thể truy cập Camera. Vui lòng cấp quyền.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  };

  const createPeerConnection = () => {
    if (peerConnection.current) return peerConnection.current;
    
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));
    }
    
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('photobooth_ice', { roomId: user?.room_id, candidate: event.candidate });
      }
    };
    
    return pc;
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setRemoteStream(null);
  };

  const handleToggleCoupleMode = async (e) => {
    const checked = e.target.checked;
    setIsCoupleMode(checked);
    
    if (checked) {
      socket.emit('data_changed', { type: 'photobooth_invite', roomId: user?.room_id });
      try {
        const pc = createPeerConnection();
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('photobooth_call', { roomId: user?.room_id, offer });
        toast("Đang gửi yêu cầu kết nối camera...");
      } catch (err) {
        console.error("Lỗi tạo WebRTC offer", err);
      }
    } else {
      endCall();
      socket.emit('photobooth_end', user?.room_id);
    }
  };

  const startSequence = async () => {
    if (!stream) {
      toast.error("Camera chưa sẵn sàng!");
      return;
    }
    
    setCaptureSequenceRunning(true);

    for (let i = 0; i < selectedLayout.slots; i++) {
      if (!isMounted.current) break;
      
      for (let c = 5; c > 0; c--) {
        if (!isMounted.current) break;
        setCountdown(c);
        if (isCoupleMode) socket.emit('photobooth_sync', { roomId: user?.room_id, count: c });
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (!isMounted.current) break;
      
      setCountdown(0);
      if (isCoupleMode) socket.emit('photobooth_sync', { roomId: user?.room_id, count: 0 });
      executeCapture(false);
      
      await new Promise(r => setTimeout(r, 1500));
    }
    
    if (isMounted.current) {
      setCaptureSequenceRunning(false);
      setCountdown(null);
    }
  };

  const executeCapture = (isRemoteTriggered = false) => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setFlash(true);
    setTimeout(() => { if(isMounted.current) setFlash(false); }, 200);
    
    if (isRemoteTriggered) {
      setCountdown(null);
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhotos(prev => [...prev, dataUrl]);
    
    if (isCoupleMode || isRemoteTriggered) {
      socket.emit('photobooth_share', { roomId: user?.room_id, photo: dataUrl, userName: user?.name });
    }
  };

  const handleNextStep = () => {
    const requiredPhotos = isCoupleMode ? selectedLayout.slots * 2 : selectedLayout.slots;
    if (capturedPhotos.length < requiredPhotos) {
      toast.error(`Vui lòng đợi chụp đủ ${requiredPhotos} tấm ảnh!`);
      return;
    }
    setStep('editor');
    stopCamera();
    endCall();
  };

  const handleLayoutChange = (layout) => {
    setSelectedLayout(layout);
    setSlots(new Array(layout.slots).fill(null));
  };

  const handleDragStart = (e, photoIndex) => {
    e.dataTransfer.setData('photoIndex', photoIndex);
  };

  const handleDrop = (e, slotIndex) => {
    e.preventDefault();
    const photoIndex = e.dataTransfer.getData('photoIndex');
    if (photoIndex !== '') {
      const newSlots = [...slots];
      newSlots[slotIndex] = capturedPhotos[photoIndex];
      setSlots(newSlots);
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  
  const removeSlot = (idx) => {
    const newSlots = [...slots];
    newSlots[idx] = null;
    setSlots(newSlots);
  };

  const drawToCanvas = async (canvas) => {
    const ctx = canvas.getContext('2d');
    const slotWidth = 300, slotHeight = 200, padding = 20;
    
    if (selectedLayout.id === 'strip-4' || selectedLayout.id === 'strip-3') {
      canvas.width = slotWidth + padding * 2;
      canvas.height = (slotHeight + padding) * selectedLayout.slots + padding * 3; 
    } else if (selectedLayout.id === 'grid-2x2') {
      canvas.width = slotWidth * 2 + padding * 3;
      canvas.height = slotHeight * 2 + padding * 3 + 80; // space for title
    } else if (selectedLayout.id === 'single') {
      canvas.width = slotWidth + padding * 2;
      canvas.height = slotHeight + padding * 2 + 60;
    }
    
    // Nền & Viền
    ctx.fillStyle = selectedFrame.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = selectedFrame.border;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Hoa văn / Emoji trang trí góc
    ctx.font = '40px sans-serif';
    ctx.fillText(selectedFrame.decoration, 15, 50);
    ctx.fillText(selectedFrame.decoration, canvas.width - 55, 50);
    ctx.fillText(selectedFrame.decoration, 15, canvas.height - 20);
    ctx.fillText(selectedFrame.decoration, canvas.width - 55, canvas.height - 20);
    
    // Load ảnh và vẽ
    await Promise.all(slots.map((photoData, idx) => {
      return new Promise((resolve) => {
        if (!photoData) { resolve(); return; }
        const img = new Image();
        img.src = photoData;
        img.onload = () => {
          let x = padding;
          let y = padding;
          
          if (selectedLayout.id === 'strip-4' || selectedLayout.id === 'strip-3') {
            y = padding + idx * (slotHeight + padding);
          } else if (selectedLayout.id === 'grid-2x2') {
            x = padding + (idx % 2) * (slotWidth + padding);
            y = padding + Math.floor(idx / 2) * (slotHeight + padding);
          } else if (selectedLayout.id === 'single') {
             // x,y already padding
          }
          
          // Vẽ nền trắng viền ảnh
          ctx.fillStyle = '#fff';
          ctx.fillRect(x - 5, y - 5, slotWidth + 10, slotHeight + 10);
          ctx.drawImage(img, x, y, slotWidth, slotHeight);
          resolve();
        };
      });
    }));
    
    // Vẽ Tiêu đề (Brand)
    ctx.fillStyle = selectedFrame.id === 'black' ? '#fff' : '#000';
    ctx.font = 'bold 28px Quicksand';
    ctx.textAlign = 'center';
    ctx.fillText('Hello Kitty House', canvas.width / 2, canvas.height - 35);
  };

  const downloadImage = async () => {
    if (slots.some(s => s === null)) {
      toast.error("Vui lòng điền đủ ảnh vào các ô trống!");
      return;
    }
    const canvas = exportCanvasRef.current;
    await drawToCanvas(canvas);
    
    const link = document.createElement('a');
    link.download = `photobooth-${selectedLayout.id}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success("Đã tải ảnh về máy!");
  };

  const saveToAlbum = async () => {
    if (slots.some(s => s === null)) {
      toast.error("Vui lòng điền đủ ảnh vào các ô trống!");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Đang lưu vào Album...");
    try {
      const canvas = exportCanvasRef.current;
      await drawToCanvas(canvas);
      
      canvas.toBlob(async (blob) => {
        try {
          const file = new File([blob], `photobooth-${Date.now()}.png`, { type: 'image/png' });
          const uploadRes = await uploadFile(file, 'ptb_'); // Send prefix
          
          if (uploadRes.url) {
             await createPhoto(uploadRes.url);
             toast.success("Đã lưu vào Album thành công!", { id: toastId });
             socket.emit('data_changed', { type: 'photo', roomId: user?.room_id });
          } else {
             toast.error("Lỗi khi tải ảnh lên!", { id: toastId });
          }
        } catch (err) {
          console.error(err);
          toast.error("Lỗi khi lưu ảnh!", { id: toastId });
        } finally {
          setIsSaving(false);
        }
      }, 'image/png');
    } catch (err) {
      toast.error("Lỗi vẽ Canvas!", { id: toastId });
      setIsSaving(false);
    }
  };

  const requiredPhotos = isCoupleMode ? selectedLayout.slots * 2 : selectedLayout.slots;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Photobooth Máy Ảnh" width="1100px">
      <div className="ptb-container" style={{ display: 'flex', flexDirection: 'column', height: '80vh', background: '#fff', borderRadius: '10px', overflow: 'hidden' }}>
        
        {step === 'capture' && (
          <div className="ptb-container" style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}>
            {/* Vùng Camera (Chia đôi trái/phải nếu Couple Mode) */}
            <div className="ptb-camera-area" style={{ flex: 2, background: '#000', position: 'relative', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
              <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scaleX(-1)' }} />
                {(isCoupleMode && remoteStream) && (
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', zIndex: 10 }}>Bạn</div>
                )}
              </div>

              {(isCoupleMode && remoteStream) && (
                <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', borderLeft: '2px solid #ff69b4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scaleX(-1)' }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', zIndex: 10 }}>Người yêu</div>
                </div>
              )}

              {/* Lớp overlay đếm ngược chung */}
              {countdown !== null && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, pointerEvents: 'none' }}>
                  <div style={{ fontSize: '10rem', color: 'white', textShadow: '0 0 20px #ff69b4', fontWeight: 'bold' }}>
                    {countdown > 0 ? countdown : '📸'}
                  </div>
                </div>
              )}
              
              {flash && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', zIndex: 10, opacity: 0.8 }} />
              )}
              
              <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 6 }}>
                <button 
                  onClick={startSequence} 
                  disabled={captureSequenceRunning} 
                  style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'white', border: '5px solid #ff69b4', cursor: captureSequenceRunning ? 'not-allowed' : 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }} 
                  title={`Bấm 1 lần chụp ${selectedLayout.slots} tấm`}>
                </button>
              </div>
              
              {captureSequenceRunning && (
                <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', color: 'white', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', zIndex: 6 }}>
                  Đang chụp tự động...
                </div>
              )}
            </div>
            
            {/* Khay ảnh tạm (Sidebar) */}
            <div className="ptb-sidebar" style={{ width: '320px', background: '#f8f8f8', borderLeft: '1px solid #eee', padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#ff69b4', fontSize: '1.2rem' }}>Cài đặt Tỉ lệ Khung</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  {LAYOUTS.map(layout => (
                    <button 
                       key={layout.id} 
                       onClick={() => handleLayoutChange(layout)}
                       disabled={captureSequenceRunning}
                       style={{ padding: '8px', background: selectedLayout.id === layout.id ? '#ff69b4' : '#e0e0e0', color: selectedLayout.id === layout.id ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: captureSequenceRunning ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {layout.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#ff69b4', fontSize: '1.2rem' }}>Khay Ảnh ({capturedPhotos.length}/{requiredPhotos})</h3>
                <label style={{ display: 'flex', alignItems: 'center', cursor: captureSequenceRunning ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={isCoupleMode} disabled={captureSequenceRunning} onChange={handleToggleCoupleMode} style={{ marginRight: '5px' }} />
                  Chụp chung
                </label>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingRight: '5px', alignContent: 'start' }}>
                {capturedPhotos.map((p, idx) => (
                  <div key={idx} style={{ width: '100%', aspectRatio: '4/3', background: '#ddd', borderRadius: '5px', overflow: 'hidden', position: 'relative' }}>
                    <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Captured ${idx}`} />
                  </div>
                ))}
                {capturedPhotos.length === 0 && (
                  <div style={{ gridColumn: 'span 2', textAlign: 'center', color: '#999', marginTop: '50px' }}>Chọn tỉ lệ khung ở trên và nhấn nút chụp để bắt đầu!</div>
                )}
              </div>
              
              <button 
                onClick={handleNextStep} 
                disabled={capturedPhotos.length < requiredPhotos || captureSequenceRunning}
                style={{ marginTop: '15px', padding: '15px', background: '#ff69b4', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (capturedPhotos.length < requiredPhotos || captureSequenceRunning) ? 'not-allowed' : 'pointer', opacity: (capturedPhotos.length >= requiredPhotos && !captureSequenceRunning) ? 1 : 0.5 }}>
                Tiếp tục (Ghép Ảnh)
              </button>
            </div>
          </div>
        )}

        {step === 'editor' && (
          <div className="ptb-container" style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}>
            <div className="ptb-sidebar" style={{ width: '320px', background: '#f8f8f8', borderRight: '1px solid #eee', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#ff69b4', fontSize: '1.1rem' }}>1. Kéo ảnh vào khung</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {capturedPhotos.map((p, idx) => (
                  <div 
                    key={idx} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, idx)}
                    style={{ width: '100%', aspectRatio: '4/3', background: '#ddd', borderRadius: '5px', overflow: 'hidden', cursor: 'grab', border: '2px solid transparent' }}
                  >
                    <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Captured ${idx}`} />
                  </div>
                ))}
              </div>
              
              <h3 style={{ margin: '15px 0', color: '#ff69b4', fontSize: '1.1rem' }}>2. Chọn viền (Frame Anime)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {FRAMES.map(f => (
                  <button 
                    key={f.id} 
                    onClick={() => setSelectedFrame(f)}
                    style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: f.color, color: f.id === 'black' ? 'white' : 'black', border: selectedFrame.id === f.id ? `3px solid ${f.border}` : 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <span>{f.name}</span>
                    <span style={{ fontSize: '1.2rem' }}>{f.decoration}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, background: '#e0e0e0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', overflowY: 'auto', position: 'relative' }}>
              {/* Dynamic Editor Canvas Preview */}
              <div className="ptb-editor-preview" style={{ 
                  background: selectedFrame.color, padding: '15px', 
                  border: `5px solid ${selectedFrame.border}`, borderRadius: '10px', 
                  display: selectedLayout.id === 'grid-2x2' ? 'grid' : 'flex', 
                  flexDirection: selectedLayout.id !== 'grid-2x2' ? 'column' : 'row',
                  gridTemplateColumns: selectedLayout.id === 'grid-2x2' ? '1fr 1fr' : 'none',
                  gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
                  width: selectedLayout.id === 'grid-2x2' ? '500px' : '250px',
                  position: 'relative'
                }}>
                
                {/* Anime Decorative Stickers using absolute positioning */}
                <span style={{ position: 'absolute', top: '5px', left: '5px', fontSize: '24px', zIndex: 5 }}>{selectedFrame.decoration}</span>
                <span style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '24px', zIndex: 5 }}>{selectedFrame.decoration}</span>
                <span style={{ position: 'absolute', bottom: '5px', left: '5px', fontSize: '24px', zIndex: 5 }}>{selectedFrame.decoration}</span>
                <span style={{ position: 'absolute', bottom: '5px', right: '5px', fontSize: '24px', zIndex: 5 }}>{selectedFrame.decoration}</span>

                {slots.map((slot, idx) => (
                  <div 
                    key={idx} 
                    onDrop={(e) => handleDrop(e, idx)} 
                    onDragOver={handleDragOver}
                    style={{ width: '100%', aspectRatio: '3/2', background: 'rgba(255,255,255,0.5)', border: '2px dashed rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden', zIndex: 2 }}
                  >
                    {slot ? (
                      <>
                        <img src={slot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Slot ${idx}`} />
                        <button onClick={() => removeSlot(idx)} style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✖</button>
                      </>
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontWeight: 'bold', fontSize: '0.9rem' }}>Thả ảnh</div>
                    )}
                  </div>
                ))}
                
                <div style={{ gridColumn: selectedLayout.id === 'grid-2x2' ? 'span 2' : 'auto', textAlign: 'center', color: selectedFrame.id==='black'?'white':'#333', fontWeight: 'bold', fontSize: '1rem', marginTop: '5px', zIndex: 2 }}>Hello Kitty House</div>
              </div>
              
              <div style={{ marginTop: '25px', display: 'flex', gap: '15px' }}>
                <button onClick={() => { setStep('capture'); startCamera(); if(isCoupleMode) handleToggleCoupleMode({target:{checked:true}}) }} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Chụp thêm</button>
                <button onClick={downloadImage} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>⬇ Tải Ảnh Xuống</button>
                <button onClick={saveToAlbum} disabled={isSaving} style={{ padding: '10px 20px', background: '#ff69b4', color: 'white', border: 'none', borderRadius: '8px', cursor: isSaving ? 'wait' : 'pointer', fontWeight: 'bold' }}>{isSaving ? '⏳ Đang lưu...' : '💖 Lưu vào Album'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />
    </Modal>
  );
};

export default PhotoboothModal;
