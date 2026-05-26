/**
 * Notification sound utility — plays short beeps using Web Audio API.
 * Respects user preference stored in localStorage('sayin-notif-sound').
 * Setting the value to 'off' disables all sounds.
 *
 * Two sound types:
 * - playNotificationSound() — for notifications/broadcasts (two-tone high beep)
 * - playChatSound()         — for chat messages (soft single tone)
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

function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('sayin-notif-sound') !== 'off';
  } catch {
    return true;
  }
}

function playTone(
  frequency1: number,
  frequency2: number,
  duration: number,
  volume: number,
  delay2 = 0.12
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const doPlay = () => {
    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency1, ctx.currentTime);
      if (frequency2 !== frequency1) {
        oscillator.frequency.setValueAtTime(frequency2, ctx.currentTime + delay2);
      }

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration * 0.6);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Web Audio API not available — silent fail
    }
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(doPlay).catch(() => {});
  } else {
    doPlay();
  }
}

/** Notification / broadcast sound — two-tone high beep (880Hz → 660Hz) */
export function playNotificationSound(): void {
  if (!isSoundEnabled()) return;
  try {
    playTone(880, 660, 0.35, 0.25, 0.12);
  } catch {
    // silent fail
  }
}

/** Chat message sound — soft single tone (520Hz) */
export function playChatSound(): void {
  if (!isSoundEnabled()) return;
  try {
    playTone(520, 520, 0.2, 0.15, 0);
  } catch {
    // silent fail
  }
}
