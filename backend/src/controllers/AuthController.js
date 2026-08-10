import AuthService from '../services/AuthService.js';

class AuthController {
  async register(req, res) {
    try {
      const { email, password, displayName, gender } = req.body;
      const data = await AuthService.sendOTPRequest(email, password, displayName, gender);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async verifyOTP(req, res) {
    try {
      const { email, code } = req.body;
      const data = await AuthService.verifyOTPAndRegister(email, code);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const data = await AuthService.sendPasswordResetOTP(email);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;
      const data = await AuthService.resetPassword(email, code, newPassword);
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);
      res.json(data);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  async getMe(req, res) {
    // req.user được gán từ authMiddleware
    res.json({ user: req.user });
  }

  async pairCouple(req, res) {
    try {
      const { partnerCode } = req.body;
      const data = await AuthService.pairCouple(req.user, partnerCode);
      const io = req.app.get('io');
      if (io && data.targetId) {
        io.to(`user_${data.targetId}`).emit('new_pair_request');
      }
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPairRequests(req, res) {
    try {
      const requests = await AuthService.getPairRequests(req.user);
      res.json({ requests });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async acceptPairRequest(req, res) {
    try {
      const { requestId } = req.body;
      const data = await AuthService.acceptPairRequest(req.user, requestId);
      const io = req.app.get('io');
      if (io && data.requesterId) {
        io.to(`user_${data.requesterId}`).emit('pair_accepted', { roomId: data.roomId });
      }
      res.json(data);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPartner(req, res) {
    try {
      const data = await AuthService.getPartner(req.user);
      res.json({ partner: data });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new AuthController();
