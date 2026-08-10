import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import { toast } from 'react-hot-toast';
import { adoptPet, interactPet, recoverStreak, equipAccessory, toggleSleep } from '../../../api/petApi';
import { soundFx } from '../../../utils/audioUtils';

const PetModal = ({ isOpen, onClose, user, socket, pet, setPet }) => {
  const [tab, setTab] = useState('interact'); // 'interact' | 'wardrobe'
  const [isAdopting, setIsAdopting] = useState(false);
  const [adoptName, setAdoptName] = useState('');
  const [adoptType, setAdoptType] = useState('cat');

  const isSleeping = () => {
    return pet?.accessories?.includes('sleep_mode');
  };

  const handleToggleSleep = async () => {
    try {
      const newState = !isSleeping();
      const updatedPet = await toggleSleep(newState);
      setPet(updatedPet);
      if (newState) {
        toast.success("Bé đã đi ngủ 🌙");
        soundFx.playSleep();
      } else {
        toast.success("Đã đánh thức bé ☀️");
        soundFx.playWake();
      }
    } catch (e) {
      toast.error(e.message || "Lỗi thay đổi trạng thái");
    }
  };

  const getPetImage = (type, level) => {
    let stage = 'baby';
    if (level >= 5 && level < 10) stage = 'teen';
    if (level >= 10) stage = 'adult';
    return `/pets/${type}_${stage}.jpg`;
  };

  const handleAdopt = async (e) => {
    e.preventDefault();
    if (!adoptName) return toast.error("Vui lòng đặt tên cho bé!");
    setIsAdopting(true);
    try {
      const newPet = await adoptPet(adoptType, adoptName);
      setPet(newPet);
      toast.success("Nhận nuôi thành công!");
    } catch (error) {
      toast.error(error.message || "Lỗi nhận nuôi");
    } finally {
      setIsAdopting(false);
    }
  };

  const handleInteract = async (action) => {
    if (isSleeping()) return toast("Bé đang ngủ say 💤 Đừng làm ồn nhé!", { icon: '🌙' });
    try {
      const updatedPet = await interactPet(action);
      setPet(updatedPet);
      
      let msg = '';
      if (action === 'feed') {
        msg = 'Bạn vừa cho bé ăn 🍖';
        soundFx.playFeed();
      }
      if (action === 'play') {
        msg = 'Bé rất vui vì được chơi đùa 🧶';
        soundFx.playPlay();
      }
      if (action === 'pet') {
        msg = 'Bé thích được vuốt ve 🥰';
        if (pet?.type === 'dog') soundFx.playBark();
        else soundFx.playMeow();
        setTimeout(() => soundFx.playPet(), 500); // Purr after meow
      }
      toast.success(msg);
      
      // Hiệu ứng tương tác
      socket.emit('data_changed', { type: 'pet_interact', action });
    } catch (error) {
      toast.error(error.message || "Lỗi tương tác");
    }
  };

  const handleRecoverStreak = async () => {
    try {
      const updatedPet = await recoverStreak();
      setPet(updatedPet);
      toast.success("Khôi phục chuỗi thành công! 🔥", { icon: '✨' });
    } catch (error) {
      toast.error(error.message || "Lỗi khôi phục chuỗi");
    }
  };

  const handleEquip = async (accId) => {
    if (isSleeping()) return toast("Bé đang ngủ, không nên thay đồ bây giờ!", { icon: '🌙' });
    try {
      const updatedPet = await equipAccessory(accId);
      setPet(updatedPet);
    } catch (error) {
      toast.error(error.message || "Lỗi thay đồ");
    }
  };

  if (!pet) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="🐾 Trung Tâm Nhận Nuôi" width="500px">
        <form onSubmit={handleAdopt} style={{ textAlign: 'center', padding: '20px' }}>
          <h3>Hãy chọn một người bạn đồng hành!</h3>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '20px 0' }}>
            <div 
              onClick={() => setAdoptType('cat')}
              style={{ padding: '10px', border: adoptType === 'cat' ? '3px solid #ff6b81' : '3px solid transparent', borderRadius: '15px', cursor: 'pointer', background: '#fff0f5' }}
            >
              <img src="/pets/cat_baby.jpg" alt="Cat" style={{ width: '100px', borderRadius: '10px' }} />
              <h4>Bé Mèo 🐱</h4>
            </div>
            <div 
              onClick={() => setAdoptType('dog')}
              style={{ padding: '10px', border: adoptType === 'dog' ? '3px solid #ff6b81' : '3px solid transparent', borderRadius: '15px', cursor: 'pointer', background: '#fff0f5' }}
            >
              <img src="/pets/dog_baby.jpg" alt="Dog" style={{ width: '100px', borderRadius: '10px' }} />
              <h4>Bé Cún 🐶</h4>
            </div>
          </div>
          <input 
            type="text" 
            placeholder="Đặt tên cho bé..." 
            value={adoptName}
            onChange={e => setAdoptName(e.target.value)}
            style={{ width: '80%', padding: '10px', borderRadius: '8px', border: '1px solid #ffb6c1', marginBottom: '20px' }}
          />
          <br/>
          <button type="submit" disabled={isAdopting} style={{ padding: '10px 30px', background: '#ff6b81', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isAdopting ? 'Đang xử lý...' : 'Nhận Nuôi Ngay ❤️'}
          </button>
        </form>
      </Modal>
    );
  }

  // Pet is adopted
  const expNeeded = pet.level * 50;
  const progress = Math.min((pet.exp / expNeeded) * 100, 100);

  const availableAccessories = [
    { id: 'acc_bowtie', name: 'Nơ Đỏ', minLevel: 5 },
    { id: 'acc_hat', name: 'Mũ Tiệc', minLevel: 5 },
    { id: 'acc_glasses', name: 'Kính Ngầu', minLevel: 10 }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`🏠 Căn nhà nhỏ của ${pet.name}`} width="600px">
      <div style={{ padding: '10px' }}>
        
        {/* Info Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff0f5', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#ff6b81' }}>{pet.name} (Cấp {pet.level})</h3>
            <div style={{ width: '200px', background: '#ddd', height: '10px', borderRadius: '5px', marginTop: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, background: '#ff6b81', height: '100%' }}></div>
            </div>
            <small style={{ color: '#666' }}>{pet.exp} / {expNeeded} EXP</small>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, color: '#ff4757' }}>🔥 {pet.streak} Ngày</h2>
            <small style={{ color: '#666' }}>Chuỗi tương tác</small>
            {pet.accessories?.includes('streak_broken') && (pet.streak_recoveries_used || 0) < 3 && (
              <button 
                onClick={handleRecoverStreak}
                style={{ display: 'block', marginTop: '5px', background: '#feca57', border: 'none', borderRadius: '10px', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Khôi phục chuỗi ({(pet.streak_recoveries_used || 0)}/3)
              </button>
            )}
          </div>
        </div>

        {/* Pet Display Area */}
        <div style={{ position: 'relative', width: '100%', height: '300px', background: '#fdfd96', borderRadius: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
          {isSleeping() && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,50,0.6)', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
              <div>Bé đang ngủ khò khò... 💤</div>
              <button 
                onClick={handleToggleSleep}
                style={{ marginTop: '15px', padding: '10px 20px', background: '#feca57', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
              >
                Đánh Thức Bé ☀️
              </button>
            </div>
          )}
          
          <div style={{ position: 'relative', width: '250px', height: '250px' }}>
            <img src={getPetImage(pet.type, pet.level)} alt="Pet" style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            
            {/* Accessories Overlays */}
            {pet.accessories?.includes('acc_bowtie') && (
              <img src="/pets/acc_bowtie.jpg" alt="Bowtie" style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', width: '60px', mixBlendMode: 'multiply' }} />
            )}
            {pet.accessories?.includes('acc_glasses') && (
              <img src="/pets/acc_glasses.jpg" alt="Glasses" style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', width: '90px', mixBlendMode: 'multiply' }} />
            )}
            {pet.accessories?.includes('acc_hat') && (
              <img src="/pets/acc_hat.jpg" alt="Hat" style={{ position: 'absolute', top: '0px', left: '50%', transform: 'translateX(-50%) rotate(15deg)', width: '70px', mixBlendMode: 'multiply' }} />
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', borderBottom: '2px solid #fff0f5', paddingBottom: '10px' }}>
          <button 
            onClick={() => setTab('interact')} 
            style={{ padding: '8px 15px', background: tab === 'interact' ? '#ff6b81' : 'transparent', color: tab === 'interact' ? 'white' : '#666', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tương tác
          </button>
          <button 
            onClick={() => setTab('wardrobe')} 
            style={{ padding: '8px 15px', background: tab === 'wardrobe' ? '#ff6b81' : 'transparent', color: tab === 'wardrobe' ? 'white' : '#666', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Tủ đồ (Phụ kiện)
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ marginTop: '20px' }}>
          {tab === 'interact' && (() => {
            const today = new Date().toISOString().split('T')[0];
            const hasFed = pet.accessories?.includes(`limit_${user?.id}_feed_${today}`);
            const hasPlayed = pet.accessories?.includes(`limit_${user?.id}_play_${today}`);
            const hasPet = pet.accessories?.includes(`limit_${user?.id}_pet_${today}`);
            const hasSleep = pet.accessories?.includes(`limit_${user?.id}_sleep_${today}`);

            return (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={() => !hasFed && handleInteract('feed')}
                  style={{ flex: 1, padding: '15px', background: '#ffeaa7', border: '2px solid #fdcb6e', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', color: '#d63031', cursor: hasFed ? 'not-allowed' : 'pointer', opacity: hasFed ? 0.5 : 1, transition: 'transform 0.1s' }}
                >
                  🍖 Cho Ăn <br/><small style={{ color: '#0984e3' }}>+10 EXP</small>
                </button>
                <button 
                  onClick={() => !hasPlayed && handleInteract('play')}
                  style={{ flex: 1, padding: '15px', background: '#81ecec', border: '2px solid #00cec9', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', color: '#0984e3', cursor: hasPlayed ? 'not-allowed' : 'pointer', opacity: hasPlayed ? 0.5 : 1, transition: 'transform 0.1s' }}
                >
                  🧶 Chơi Đùa <br/><small style={{ color: '#0984e3' }}>+10 EXP</small>
                </button>
                <button 
                  onClick={() => !hasPet && handleInteract('pet')}
                  style={{ flex: 1, padding: '15px', background: '#fd79a8', border: '2px solid #e84393', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', cursor: hasPet ? 'not-allowed' : 'pointer', opacity: hasPet ? 0.5 : 1, transition: 'transform 0.1s' }}
                >
                  👋 Vuốt Ve <br/><small style={{ color: '#fff' }}>+10 EXP</small>
                </button>
                
                <button 
                  onClick={() => !hasSleep && handleToggleSleep()}
                  style={{ flex: 0.5, padding: '15px', background: '#a29bfe', border: '2px solid #6c5ce7', borderRadius: '15px', fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', cursor: hasSleep ? 'not-allowed' : 'pointer', opacity: hasSleep ? 0.5 : 1, transition: 'transform 0.1s' }}
                  title="Cho bé đi ngủ"
                >
                  {isSleeping() ? '☀️ Thức' : '🌙 Ngủ'}
                </button>
              </div>
            );
          })()}

          {tab === 'wardrobe' && (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {availableAccessories.map(acc => {
                const isUnlocked = pet.level >= acc.minLevel;
                const isEquipped = pet.accessories?.includes(acc.id);
                
                return (
                  <div key={acc.id} style={{ width: '100px', textAlign: 'center', background: '#f5f6fa', borderRadius: '10px', padding: '10px', opacity: isUnlocked ? 1 : 0.5 }}>
                    <img src={`/pets/${acc.id}.jpg`} alt={acc.name} style={{ width: '60px', height: '60px', objectFit: 'cover', mixBlendMode: 'multiply', borderRadius: '10px' }} />
                    <p style={{ margin: '5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>{acc.name}</p>
                    {!isUnlocked ? (
                      <small style={{ color: '#e84118' }}>Mở ở Cấp {acc.minLevel}</small>
                    ) : (
                      <button 
                        onClick={() => handleEquip(acc.id)}
                        style={{ padding: '5px 10px', background: isEquipped ? '#ff6b81' : '#dcdde1', color: isEquipped ? 'white' : '#333', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem', width: '100%' }}
                      >
                        {isEquipped ? 'Tháo ra' : 'Mặc vào'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default PetModal;
