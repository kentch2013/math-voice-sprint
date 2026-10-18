let audioCtx: AudioContext | null = null;

/**
 * Oscillator-based Web Audio bell chime (880Hz sine wave decaying over 0.3s).
 */
export function playCorrectChime(): void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);

    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn('Unable to play audio chime:', e);
  }
}
