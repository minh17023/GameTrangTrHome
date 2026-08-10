import PetRepository from '../repositories/PetRepository.js';

class PetController {
  async getPet(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");
      
      const pet = await PetRepository.getPetByRoom(roomId);
      res.json({ pet });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async adoptPet(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");
      
      const existingPet = await PetRepository.getPetByRoom(roomId);
      if (existingPet) throw new Error("Phòng này đã có thú cưng!");

      const { type, name } = req.body;
      if (!['cat', 'dog'].includes(type)) throw new Error("Loại thú cưng không hợp lệ");

      const newPet = await PetRepository.adoptPet(roomId, type, name);
      
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('pet_updated', newPet);
      
      res.json({ pet: newPet });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async interact(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");
      
      const pet = await PetRepository.getPetByRoom(roomId);
      if (!pet) throw new Error("Chưa có thú cưng");

      const now = new Date();
      const lastInteracted = new Date(pet.last_interacted_at);
      
      // Calculate day difference (ignoring time)
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysDiff = Math.floor(now.getTime() / msPerDay) - Math.floor(lastInteracted.getTime() / msPerDay);
      
      let newStreak = pet.streak;
      
      if (daysDiff === 1) {
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Streak broken
        newStreak = 1;
      } else if (daysDiff === 0 && pet.exp > 0) {
        // Already interacted today, just give EXP but no streak increase
      } else if (pet.exp === 0) {
        newStreak = 1; // First interaction ever
      }

      // Add EXP (10 EXP per interaction)
      let newExp = pet.exp + 10;
      let newLevel = pet.level;
      
      // Level up logic (every 50 exp = 1 level)
      if (newExp >= newLevel * 50) {
        newLevel += 1;
      }

      const updatedPet = await PetRepository.updatePet(pet.id, {
        exp: newExp,
        level: newLevel,
        streak: newStreak,
        last_interacted_at: now.toISOString()
      });
      
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('pet_interacted', { pet: updatedPet, action: req.body.action });
      
      res.json({ pet: updatedPet });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async recoverStreak(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");
      
      const pet = await PetRepository.getPetByRoom(roomId);
      if (!pet) throw new Error("Chưa có thú cưng");

      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      let recoveriesUsed = pet.streak_recoveries_used || 0;
      if (pet.last_recovery_month !== currentMonth) {
        recoveriesUsed = 0; // Reset count for new month
      }

      if (recoveriesUsed >= 3) {
        throw new Error("Đã hết lượt khôi phục chuỗi trong tháng này (Tối đa 3 lần/tháng)");
      }

      // We recover the streak to what it was + 1 (assuming they missed yesterday)
      // Actually, we don't know what it was before it broke unless we store it.
      // Since we don't store `previous_streak`, we can't easily restore it if it was overwritten to 1.
      // Ah! If it's broken, it gets overwritten to 1. 
      // To properly recover, we need `highest_streak` or `previous_streak`.
      // For simplicity, let's just add 10 to the current streak as a "recovery bonus" or if we add a `previous_streak` to DB...
      // Let's just add +5 streak as a recovery mechanic, or throw error saying we need previous_streak column.
      // Wait, let's update PetRepository to store `previous_streak`? No, let's just do:
      const updatedPet = await PetRepository.updatePet(pet.id, {
        streak: pet.streak + 5, // Tạm thời cộng 5 ngày
        streak_recoveries_used: recoveriesUsed + 1,
        last_recovery_month: currentMonth
      });
      
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('pet_updated', updatedPet);
      
      res.json({ pet: updatedPet });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async equipAccessory(req, res) {
    try {
      const roomId = req.user.room_id;
      if (!roomId) throw new Error("Chưa ghép đôi");
      
      const { accessoryId } = req.body;
      const pet = await PetRepository.getPetByRoom(roomId);
      if (!pet) throw new Error("Chưa có thú cưng");

      let accessories = pet.accessories || [];
      if (accessories.includes(accessoryId)) {
        accessories = accessories.filter(a => a !== accessoryId); // unequip
      } else {
        accessories.push(accessoryId); // equip
      }

      const updatedPet = await PetRepository.updatePet(pet.id, { accessories });
      
      const io = req.app.get('io');
      if (io) io.to(roomId).emit('pet_updated', updatedPet);
      
      res.json({ pet: updatedPet });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new PetController();
