// Web Audio API Synthesizer for Test Bird Chirp Sounds in Localhost

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Play synthesized realistic bird chirp sound effect
export const playBirdChirp = (chirpType = 1) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (chirpType === 1) {
      // Single Crisp Bird Chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      
      // Frequency pitch slide: 2200Hz up to 3400Hz then down to 2800Hz
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(3500, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } else if (chirpType === 2) {
      // Double Bird Chirp (Chirp-Chirp!)
      const playSingleNote = (delay, startFreq, endFreq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, now + delay);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + delay + 0.07);

        gain.gain.setValueAtTime(0, now + delay);
        gain.gain.linearRampToValueAtTime(0.25, now + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.09);
      };

      playSingleNote(0, 2400, 3600);
      playSingleNote(0.1, 2800, 4000);
    } else {
      // Gentle High Melodic Chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.exponentialRampToValueAtTime(3200, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.12);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    console.error('Failed to play bird chirp audio test', e);
  }
};
