import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { socket } from '../../utils/socket';
import { getMessages, sendMessage } from '../../api/messageApi';
import { uploadFile } from '../../api/uploadApi';
import { toast } from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const Messenger = ({ partner, isOnline, onClose, onMinimize }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Call states
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, connected
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, offer, isVideo }
  
  // WebRTC refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const callStateRef = useRef(callState);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    loadMessages();
    
    // Socket Listeners for Chat
    const handleChatMessage = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 100);
    };

    // Socket Listeners for WebRTC
    const handleIncomingCall = async ({ callerId, offer, isVideo }) => {
      if (callStateRef.current !== 'idle') return; // Bận
      setIncomingCall({ callerId, offer, isVideo });
      setCallState('ringing');
    };

    const handleCallAnswered = async ({ answer }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          setCallState('connected');
        } catch (err) {
          console.error("Lỗi setRemoteDescription:", err);
        }
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error("Lỗi addIceCandidate", e);
        }
      }
    };

    const handleCallEnded = () => {
      endCallLocally();
      toast('Cuộc gọi đã kết thúc', { icon: '📞' });
    };

    socket.on('chat_message', handleChatMessage);
    socket.on('call_incoming', handleIncomingCall);
    socket.on('call_answered', handleCallAnswered);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('chat_message', handleChatMessage);
      socket.off('call_incoming', handleIncomingCall);
      socket.off('call_answered', handleCallAnswered);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
    };
  }, []);

  useEffect(() => {
    return () => {
      endCallLocally(); // Thực sự cleanup khi component unmount
    };
  }, []);

  const loadMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
      setTimeout(scrollToBottom, 300);
    } catch (err) {
      console.error('Lỗi lấy tin nhắn', err);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendText = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      const newMsg = await sendMessage('text', inputText);
      setMessages(prev => {
        if (prev.find(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setInputText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      toast.error('Lỗi gửi tin nhắn');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = e => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());
          const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
          
          toast.loading("Đang gửi voice...", { id: 'voice' });
          try {
            const res = await uploadFile(file);
            const newMsg = await sendMessage('voice', res.url);
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
            toast.success("Đã gửi!", { id: 'voice' });
          } catch (err) {
            toast.error("Lỗi gửi voice", { id: 'voice' });
          }
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        toast.error("Lỗi cấp quyền Microphone");
      }
    }
  };

  // --- WebRTC Logic ---
  const startCall = async (video) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      setIsVideoCall(video);
      setCallState('calling');
      
      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
      
      stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));
      
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { roomId: user.room_id, candidate: event.candidate });
        }
      };

      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('call_user', { roomId: user.room_id, callerId: user.id, offer, isVideo: video });
      
    } catch (err) {
      console.error(err);
      toast.error("Không thể truy cập Camera/Microphone");
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    try {
      const { offer, isVideo } = incomingCall;
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      localStreamRef.current = stream;
      setIsVideoCall(isVideo);
      
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      
      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
      stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));
      
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('ice_candidate', { roomId: user.room_id, candidate: event.candidate });
        }
      };

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      socket.emit('answer_call', { roomId: user.room_id, answer });
      setCallState('connected');
      
    } catch (err) {
      console.error(err);
      toast.error("Không thể truy cập Camera/Microphone");
      endCallLocally();
    }
  };

  const rejectCall = () => {
    socket.emit('end_call', user.room_id);
    endCallLocally();
  };

  const endCallLocally = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    setCallState('idle');
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    socket.emit('end_call', user.room_id);
    endCallLocally();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#ffe4e1', borderRadius: '15px 15px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ffb6c1', backgroundImage: partner?.avatar_url ? `url(${partner.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
            <span style={{ 
              position: 'absolute', bottom: '0px', right: '0px', 
              width: '12px', height: '12px', borderRadius: '50%', 
              background: isOnline ? '#4cd137' : '#ccc',
              border: '2px solid white'
            }} title={isOnline ? "Online" : "Offline"}></span>
          </div>
          <h3 style={{ margin: 0, color: '#ff6b81' }}>{partner?.display_name || 'Nửa kia'}</h3>
        </div>
        
        {callState === 'idle' && (
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => startCall(false)} style={{ background: '#4cd137', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontSize: '1.1rem' }}>📞</button>
            <button onClick={() => startCall(true)} style={{ background: '#00a8ff', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontSize: '1.1rem' }}>📹</button>
            <button onClick={onMinimize} style={{ background: '#ffda79', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>-</button>
            <button onClick={onClose} style={{ background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', cursor: 'pointer', fontSize: '1.1rem' }}>✖</button>
          </div>
        )}
      </div>

      {/* BODY (Chat or Call) */}
      <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: 'white', position: 'relative' }}>
        
        {/* RINGING UI */}
        {callState === 'ringing' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255, 255, 255, 0.9)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ color: '#ff6b81', animation: 'pulse 1.5s infinite' }}>{partner?.display_name} đang gọi {incomingCall?.isVideo ? 'Video' : 'Thoại'}...</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
              <button onClick={acceptCall} style={{ background: '#4cd137', color: 'white', padding: '10px 20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Nghe</button>
              <button onClick={rejectCall} style={{ background: '#ff4757', color: 'white', padding: '10px 20px', borderRadius: '20px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>Từ chối</button>
            </div>
          </div>
        )}

        {/* CALL UI (PIP / Full area) */}
        {(callState === 'calling' || callState === 'connected') && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#2f3640', zIndex: 5, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, position: 'relative', background: '#000' }}>
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ position: 'absolute', bottom: '10px', right: '10px', width: '100px', height: '150px', background: '#333', border: '2px solid white', borderRadius: '10px', objectFit: 'cover' }}
              />
              {callState === 'calling' && <p style={{ position: 'absolute', top: '50%', left: '0', right: '0', textAlign: 'center', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>Đang gọi...</p>}
            </div>
            <div style={{ padding: '15px', display: 'flex', justifyContent: 'center', background: '#2f3640' }}>
              <button onClick={handleEndCall} style={{ background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '50px', height: '50px', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons">call_end</span>
              </button>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', opacity: callState === 'idle' ? 1 : 0.2 }}>
          {messages.map(msg => {
            const isMe = msg.sender_id === user.id;
            const timeStr = msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: '5px' }}>
                <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', width: '100%' }}>
                  <div style={{ 
                    background: isMe ? '#ff6b81' : '#f1f2f6', 
                    color: isMe ? 'white' : 'black', 
                    padding: '10px 15px', 
                    borderRadius: isMe ? '20px 20px 0 20px' : '20px 20px 20px 0',
                    maxWidth: '70%',
                    wordBreak: 'break-word'
                  }}>
                    {msg.type === 'text' && <span>{msg.content}</span>}
                    {msg.type === 'voice' && <audio src={msg.content} controls style={{ height: '30px', maxWidth: '200px' }} />}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#999', marginTop: '2px', marginRight: isMe ? '5px' : '0', marginLeft: isMe ? '0' : '5px' }}>
                  {timeStr} {isMe && ' • Đã gửi'}
                </span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ padding: '10px', background: '#ffe4e1', borderRadius: '0 0 15px 15px', display: 'flex', gap: '10px', pointerEvents: callState === 'idle' ? 'auto' : 'none', opacity: callState === 'idle' ? 1 : 0.5 }}>
        <input 
          type="text" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSendText(e)}
          placeholder="Nhắn tin..."
          style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: 'none', outline: 'none' }}
        />
        <button 
          onClick={toggleRecording} 
          style={{ 
            background: isRecording ? '#ff4757' : 'white', 
            color: isRecording ? 'white' : '#ff6b81', 
            border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <span className="material-icons">{isRecording ? 'stop' : 'mic'}</span>
        </button>
        <button 
          onClick={handleSendText}
          style={{ background: '#ff6b81', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <span className="material-icons">send</span>
        </button>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Messenger;
