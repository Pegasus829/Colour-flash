// Audio context and sound generation utilities
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

// Generate a success/correct sound - pleasant ascending tone
export function playCorrectSound(volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn('Could not play correct sound:', e);
  }
}

// Generate an error/wrong sound - dissonant descending tone
export function playWrongSound(volume: number = 0.3): void {
  try {
    const ctx = getAudioContext();
    const oscillator1 = ctx.createOscillator();
    const oscillator2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator1.type = 'sawtooth';
    oscillator2.type = 'square';

    oscillator1.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    oscillator2.frequency.setValueAtTime(205, ctx.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(95, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + 0.4);
    oscillator2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Could not play wrong sound:', e);
  }
}

// Generate game over sound - dramatic descending tone
export function playGameOverSound(volume: number = 0.4): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1);
  } catch (e) {
    console.warn('Could not play game over sound:', e);
  }
}

// Background music generator
let musicOscillators: OscillatorNode[] = [];
let musicGain: GainNode | null = null;
let musicPlaying = false;

export function startBackgroundMusic(speed: number = 1, volume: number = 0.1): void {
  if (musicPlaying) {
    updateMusicSpeed(speed);
    return;
  }

  try {
    const ctx = getAudioContext();
    musicGain = ctx.createGain();
    musicGain.connect(ctx.destination);
    musicGain.gain.setValueAtTime(volume, ctx.currentTime);

    // Create a simple arpeggio pattern
    const baseFreq = 261.63; // C4
    const notes = [1, 1.25, 1.5, 1.25]; // C, E, G, E pattern

    notes.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.connect(noteGain);
      noteGain.connect(musicGain!);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, ctx.currentTime);

      // Pulse the notes based on speed
      const interval = 0.5 / speed;
      const startDelay = i * (interval / 4);

      noteGain.gain.setValueAtTime(0, ctx.currentTime);

      osc.start(ctx.currentTime + startDelay);
      musicOscillators.push(osc);
    });

    musicPlaying = true;
  } catch (e) {
    console.warn('Could not start background music:', e);
  }
}

export function updateMusicSpeed(speed: number): void {
  // Adjust the overall tempo feel through volume based on speed
  if (musicGain) {
    const ctx = getAudioContext();
    musicGain.gain.setValueAtTime(0.1 + (speed - 1) * 0.05, ctx.currentTime);
  }
}

export function stopBackgroundMusic(): void {
  musicOscillators.forEach(osc => {
    try {
      osc.stop();
    } catch {
      // ignore
    }
  });
  musicOscillators = [];
  musicGain = null;
  musicPlaying = false;
}

// Click/tap sound for UI interactions
export function playClickSound(volume: number = 0.15): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  } catch (e) {
    console.warn('Could not play click sound:', e);
  }
}

// Countdown tick sound
export function playTickSound(volume: number = 0.2): void {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn('Could not play tick sound:', e);
  }
}
