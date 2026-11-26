/**
 * Authentic mechanical mouse click audio player.
 * Uses pre-decoded 16-bit PCM audio of a physical mouse microswitch
 * via the native Web Audio API for zero latency and zero external network requests.
 */

import { MOUSE_CLICK_BASE64 } from "./mouseClickAudioData";

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

export interface MouseClickSoundConfig {
  /**
   * Playback volume multiplier (0.0 to 1.0). Default is 0.65.
   */
  volume?: number;
}

let sharedAudioContext: AudioContext | null = null;
let cachedClickBuffer: AudioBuffer | null = null;
let isDecoding = false;
let fallbackAudio: HTMLAudioElement | null = null;

/**
 * Converts a base64 string to an ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Lazily retrieves and unlocks the shared AudioContext on user interaction.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!sharedAudioContext) {
    const win = window as WindowWithWebkitAudio;
    const AudioContextClass = window.AudioContext || win.webkitAudioContext;

    if (AudioContextClass) {
      sharedAudioContext = new AudioContextClass();
    }
  }

  if (sharedAudioContext && sharedAudioContext.state === "suspended") {
    void sharedAudioContext.resume();
  }

  return sharedAudioContext;
}

/**
 * Pre-decodes the authentic mouse click audio buffer into memory.
 */
function ensureAudioBufferDecoded(ctx: AudioContext): void {
  if (cachedClickBuffer || isDecoding) {
    return;
  }

  isDecoding = true;
  try {
    const arrayBuffer = base64ToArrayBuffer(MOUSE_CLICK_BASE64);
    void ctx
      .decodeAudioData(arrayBuffer)
      .then((decodedBuffer: AudioBuffer) => {
        cachedClickBuffer = decodedBuffer;
        isDecoding = false;
      })
      .catch(() => {
        isDecoding = false;
      });
  } catch {
    isDecoding = false;
  }
}

/**
 * Plays via HTMLAudioElement as a lightweight fallback.
 */
function playFallback(volume: number): void {
  try {
    if (!fallbackAudio) {
      fallbackAudio = new Audio(`data:audio/wav;base64,${MOUSE_CLICK_BASE64}`);
    }
    fallbackAudio.currentTime = 0;
    fallbackAudio.volume = volume;
    void fallbackAudio.play();
  } catch {
    // Graceful fallback
  }
}

/**
 * Plays the real, physical mouse click sound.
 * Synchronous and instant with 0ms latency once decoded into AudioBuffer.
 */
export function playMouseClickSound(config?: MouseClickSoundConfig): void {
  const volume = config?.volume ?? 0.65;

  try {
    const ctx = getAudioContext();
    if (!ctx) {
      playFallback(volume);
      return;
    }

    if (!cachedClickBuffer) {
      ensureAudioBufferDecoded(ctx);
      // If not yet decoded on first microsecond, play fallback audio
      playFallback(volume);
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = cachedClickBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(ctx.currentTime);
  } catch {
    playFallback(volume);
  }
}

// Prepare the audio on the visitor's first interaction rather than at
// startup: browsers only allow an AudioContext to start after a user
// gesture anyway, and this keeps decoding off the page-load path.
if (typeof window !== "undefined") {
  const prepare = () => {
    window.removeEventListener("pointerdown", prepare, true);
    window.removeEventListener("keydown", prepare, true);
    const ctx = getAudioContext();
    if (ctx) {
      ensureAudioBufferDecoded(ctx);
    }
  };
  window.addEventListener("pointerdown", prepare, {
    capture: true,
    passive: true,
  });
  window.addEventListener("keydown", prepare, { capture: true });
}
