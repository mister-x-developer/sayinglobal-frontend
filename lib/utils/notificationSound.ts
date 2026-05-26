/**
 * Notification sound utility — plays a short two-tone beep using Web Audio API.
 * Respects user preference stored in localStorage('sayin-notif-sound').
 * Setting the value to 'off' disables the sound.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Resume AudioContext on first user interaction (required by browsers)
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', resumeAudio, { once: false, passive: true });
  window.addEventListener('touchstart', resumeAudio, { once: false, passive: true });
  window.addEventListener('keydown', resumeAudio, { once: false, passive: true });
}

export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const soundEnabled = localStorage.getItem('sayin-notif-sound') !== 'off';
    if (!soundEnabled) return;

    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        // Two-tone notification: high (880Hz) then lower (660Hz)
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.12);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02);
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.35);
      } catch {
        // Web Audio API not available — silent fail
      }
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // Silent fail — notification sound is non-critical
  }
}
