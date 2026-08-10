class AudioEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, vol = 0.1, slideTo = null) {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playMeow() {
    this.playTone(800, 'sine', 0.5, 0.2, 400); // High to low
  }
  
  playBark() {
    this.playTone(300, 'sawtooth', 0.2, 0.2, 100); // short and low
  }

  playFeed() {
    this.init();
    // Happy eating sound
    setTimeout(() => this.playTone(600, 'sine', 0.1, 0.1), 0);
    setTimeout(() => this.playTone(800, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(1000, 'sine', 0.2, 0.1), 200);
  }

  playPlay() {
    this.init();
    // Bouncy
    setTimeout(() => this.playTone(400, 'triangle', 0.1, 0.1, 800), 0);
    setTimeout(() => this.playTone(600, 'triangle', 0.1, 0.1, 1000), 150);
  }

  playPet() {
    this.init();
    // Purr / happy hum
    this.playTone(200, 'sine', 1.0, 0.1, 220);
  }

  playSleep() {
    this.init();
    // Snore / fall asleep
    this.playTone(300, 'sine', 0.8, 0.1, 100);
  }

  playWake() {
    this.init();
    // Wake up
    this.playTone(300, 'triangle', 0.5, 0.1, 900);
  }
}

export const soundFx = new AudioEngine();
