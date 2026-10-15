/**
 * AutoGuardian AI - Audio Alert & Text-To-Speech Synthesizer
 * Uses Web Audio API to generate synthetic warning chimes (no external audio files needed)
 * and Web Speech API SpeechSynthesis for clear, advisory spoken voice alerts.
 */
import { RiskSeverity } from '../types';

class AudioAlertManager {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSpeechEnabled: boolean = true;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private speechCooldownMs: number = 4000;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policies
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setSpeechEnabled(enabled: boolean) {
    this.isSpeechEnabled = enabled;
  }

  public getSpeechEnabled(): boolean {
    return this.isSpeechEnabled;
  }

  /**
   * Generates synthetic acoustic tones based on severity:
   * CRITICAL: Rapid high-pitch urgent dual tone
   * HIGH: Moderate pitch chime
   * MEDIUM / LOW: Soft advisory tone
   */
  public playTone(severity: RiskSeverity) {
    if (this.isMuted) return;
    try {
      this.initAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      if (severity === 'CRITICAL') {
        // High urgency beep
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1200, now + 0.1);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (severity === 'HIGH') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (severity === 'MEDIUM') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // AudioContext unavailable or autoplay blocked
    }
  }

  /**
   * Spoken verbal announcement using browser text-to-speech.
   * Enforces cooldown to prevent repetitive spoken looping.
   */
  public speakAlert(text: string, force: boolean = false) {
    if (this.isMuted || !this.isSpeechEnabled) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (!force && text === this.lastSpokenText && (now - this.lastSpokenTime) < this.speechCooldownMs) {
      return; // Suppress duplicate speech repetition
    }

    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.volume = 0.9;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis error handled silently
    }
  }
}

export const audioAlerts = new AudioAlertManager();
