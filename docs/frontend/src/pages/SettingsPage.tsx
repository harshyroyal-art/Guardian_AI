import React, { useEffect, useState } from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Sliders,
  Shield,
  RotateCcw,
  Save,
  CheckCircle,
  Info,
} from 'lucide-react';
import { SystemSettings } from '../types';
import { api } from '../services/api';
import { audioAlerts } from '../utils/audioAlerts';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    audio_alerts_enabled: true,
    spoken_voice_enabled: true,
    alert_cooldown_seconds: 3.0,
    eye_closure_threshold_seconds: 1.5,
    drowsiness_sensitivity: 'NORMAL',
    collision_distance_threshold_meters: 15.0,
    parking_stop_threshold_meters: 0.5,
    parking_caution_threshold_meters: 1.2,
    demo_mode_enabled: true,
    data_retention_max_events: 500,
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.getSettings()
      .then((s) => setSettings(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      audioAlerts.setMuted(!updated.audio_alerts_enabled);
      audioAlerts.setSpeechEnabled(updated.spoken_voice_enabled);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // Handled silently
    }
  };

  const resetDefaults = () => {
    const defaults: SystemSettings = {
      audio_alerts_enabled: true,
      spoken_voice_enabled: true,
      alert_cooldown_seconds: 3.0,
      eye_closure_threshold_seconds: 1.5,
      drowsiness_sensitivity: 'NORMAL',
      collision_distance_threshold_meters: 15.0,
      parking_stop_threshold_meters: 0.5,
      parking_caution_threshold_meters: 1.2,
      demo_mode_enabled: true,
      data_retention_max_events: 500,
    };
    setSettings(defaults);
    api.updateSettings(defaults).catch(() => {});
    audioAlerts.setMuted(false);
    audioAlerts.setSpeechEnabled(true);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-cyan-400" />
              Settings, Calibration & Privacy
            </h1>
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Configure advisory alert thresholds, acoustic chimes, speech synthesis, duplicate cooldown windows, and privacy policies.
          </p>
        </div>

        <button
          onClick={resetDefaults}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          Restore Factory Defaults
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>System configuration and risk thresholds updated successfully.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Audio & Speech Alerts */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              Auditory Warnings & Voice Guidance
            </h3>

            {/* Audio Alerts Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Acoustic Warning Chimes</span>
                <span className="text-[11px] text-gray-400">
                  Synthesizes multi-frequency warning beeps for critical and high hazards.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.audio_alerts_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, audio_alerts_enabled: e.target.checked })
                }
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Speech Synthesis Toggle */}
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">Spoken Advisory Voice</span>
                <span className="text-[11px] text-gray-400">
                  Speaks advisory driving recommendations using browser text-to-speech.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.spoken_voice_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, spoken_voice_enabled: e.target.checked })
                }
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Alert Cooldown Window */}
            <div className="space-y-1 pt-2 border-t border-gray-800">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Alert Cooldown Window:</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.alert_cooldown_seconds}s</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={settings.alert_cooldown_seconds}
                onChange={(e) =>
                  setSettings({ ...settings, alert_cooldown_seconds: parseFloat(e.target.value) })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 block">
                Suppresses repetitive non-critical auditory alerts occurring within this timeframe.
              </span>
            </div>
          </div>

          {/* Section 2: Drowsiness & Vision Thresholds */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Driver Attention Calibration
            </h3>

            {/* Eye Closure Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Eye Closure Cutoff:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {settings.eye_closure_threshold_seconds}s
                </span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.0"
                step="0.1"
                value={settings.eye_closure_threshold_seconds}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    eye_closure_threshold_seconds: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 block">
                Continuous eye closure beyond this duration triggers a Critical Drowsiness Hazard.
              </span>
            </div>

            {/* Drowsiness Sensitivity */}
            <div className="space-y-1 text-xs">
              <span className="text-gray-300 font-medium block">Sensitivity Profile:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'NORMAL', 'HIGH'] as const).map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSettings({ ...settings, drowsiness_sensitivity: lvl })}
                    className={`py-1.5 rounded-lg font-bold transition text-xs ${
                      settings.drowsiness_sensitivity === lvl
                        ? 'bg-cyan-500 text-gray-950 shadow'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Collision & Parking Thresholds */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Proximity & Distance Cutoffs
            </h3>

            {/* Forward Collision Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Forward Collision Caution:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {settings.collision_distance_threshold_meters}m
                </span>
              </div>
              <input
                type="range"
                min="8.0"
                max="25.0"
                step="1.0"
                value={settings.collision_distance_threshold_meters}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    collision_distance_threshold_meters: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Parking Stop Cutoff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Parking Emergency Stop Cutoff:</span>
                <span className="font-mono text-red-400 font-bold">
                  {settings.parking_stop_threshold_meters}m
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={settings.parking_stop_threshold_meters}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    parking_stop_threshold_meters: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Section 4: Privacy & Retention */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-gray-800 pb-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Privacy & In-Memory Retention
            </h3>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Max Session Events Stored:</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {settings.data_retention_max_events}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={settings.data_retention_max_events}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    data_retention_max_events: parseInt(e.target.value),
                  })
                }
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#0c121d] border border-gray-800 text-[11px] text-gray-400 space-y-1">
              <p className="font-semibold text-gray-300">Privacy Safeguards</p>
              <p>• Camera frames are analyzed in transient RAM and discarded immediately.</p>
              <p>• No video, biometric imagery, or audio is stored on disk or transmitted to the cloud.</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" />
            Save Configuration Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
