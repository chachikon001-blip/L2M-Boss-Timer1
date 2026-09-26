// Web Audio API synthesizer for clean sound alerts without external audio file dependencies

class SoundController {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public playSound(type: 'synth-crystal' | 'synth-alarm' | 'synth-radar' | 'synth-bell', volume = 0.8) {
    const ctx = this.getContext();
    if (!ctx) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(1, volume)), ctx.currentTime);
    masterGain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'synth-crystal') {
      // Pleasant crystal alert: 3 notes ascending
      const freqs = [587.33, 880, 1174.66]; // D5, A5, D6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.65);
      });
    } else if (type === 'synth-alarm') {
      // Dual high-intensity pulsing warning
      [0, 0.18, 0.36].forEach((startOffset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950, now + startOffset);
        osc.frequency.exponentialRampToValueAtTime(650, now + startOffset + 0.12);

        gain.gain.setValueAtTime(0.4, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + 0.14);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now + startOffset);
        osc.stop(now + startOffset + 0.15);
      });
    } else if (type === 'synth-radar') {
      // Sonar radar pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.4);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.55);
    } else if (type === 'synth-bell') {
      // Warm gong/bell
      const freqs = [440, 880, 1320];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3 / (i + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 1.25);
      });
    }
  }

  public speak(text: string, volume = 0.8, gender: 'female' | 'male' = 'female', rate = 1.05, pitch?: number) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = Math.max(0.1, Math.min(1, volume));
      utterance.rate = rate || 1.05;
      
      // Default pitch based on gender if not specified
      if (typeof pitch === 'number') {
        utterance.pitch = pitch;
      } else {
        utterance.pitch = gender === 'female' ? 1.15 : 0.85;
      }

      // Try finding a Thai voice if available
      const voices = window.speechSynthesis.getVoices();
      const thaiVoices = voices.filter((v) => v.lang.startsWith('th') || v.name.toLowerCase().includes('thai'));

      if (thaiVoices.length > 0) {
        if (gender === 'female') {
          const femaleThai = thaiVoices.find((v) =>
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('premwadee') ||
            v.name.toLowerCase().includes('kanya') ||
            v.name.toLowerCase().includes('siri') ||
            v.name.toLowerCase().includes('google')
          );
          utterance.voice = femaleThai || thaiVoices[0];
        } else {
          const maleThai = thaiVoices.find((v) =>
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('niwat') ||
            v.name.toLowerCase().includes('man')
          );
          utterance.voice = maleThai || thaiVoices[0];
        }
        utterance.lang = 'th-TH';
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis errors
    }
  }
}

export const soundManager = new SoundController();

export function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'boss-timer-alert',
      });
    } catch {
      // Ignore notification failures
    }
  }
}
