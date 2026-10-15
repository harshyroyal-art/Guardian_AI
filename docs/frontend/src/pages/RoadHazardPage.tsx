import React, { useState } from 'react';
import {
  AlertTriangle,
  Upload,
  Play,
  Info,
  CheckCircle,
  ShieldAlert,
  Sliders,
  Layers,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface RoadHazardPageProps {
  onRefreshEvents: () => void;
}

export const RoadHazardPage: React.FC<RoadHazardPageProps> = ({ onRefreshEvents }) => {
  const [selectedHazard, setSelectedHazard] = useState<string>('deep_pothole');
  const [hazardDistance, setHazardDistance] = useState<number>(12.0);
  const [severityLevel, setSeverityLevel] = useState<string>('severe');
  const [confidence, setConfidence] = useState<number>(0.88);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  const handleTrigger = async () => {
    try {
      await api.triggerDemoScenario('road_hazard', {
        hazard_type: selectedHazard,
        distance_m: hazardDistance,
        severity_level: severityLevel,
      });
      setTriggerStatus(`Road hazard event generated: ${selectedHazard.replace(/_/g, ' ')} at ${hazardDistance}m.`);
      onRefreshEvents();
    } catch {
      setTriggerStatus('Failed to send hazard event to risk engine.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              Road Hazard & Surface Anomaly Scanner
            </h1>
            <StatusBadge mode="DEMO_SIMULATION" />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Roadway surface hazard identification: detects potholes, road debris, construction zones, and stopped vehicles.
          </p>
        </div>

        <button
          onClick={handleTrigger}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 transition shadow-lg shadow-amber-500/20"
        >
          <Play className="w-4 h-4 fill-current" />
          Trigger Hazard Alert
        </button>
      </div>

      {triggerStatus && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{triggerStatus}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hazard Types Catalog & Visualizer */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Supported Hazard Categories
            </h3>
            <span className="text-xs font-mono text-cyan-400">Deterministic Scenario Lab</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                id: 'deep_pothole',
                title: 'Severe Pothole',
                desc: 'Structural road depression capable of causing rim or tire failure.',
                risk: 'HIGH',
              },
              {
                id: 'road_debris',
                title: 'Tire Shred / Debris',
                desc: 'Loose cargo or blown truck tire fragments in driving lane.',
                risk: 'HIGH',
              },
              {
                id: 'construction_cone',
                title: 'Lane Construction Barrier',
                desc: 'Unmarked traffic drums or safety cones narrowing the lane.',
                risk: 'MEDIUM',
              },
              {
                id: 'stopped_vehicle',
                title: 'Disabled Shoulder Vehicle',
                desc: 'Stationary vehicle partly protruding into the travel lane.',
                risk: 'HIGH',
              },
            ].map((hz) => (
              <div
                key={hz.id}
                onClick={() => setSelectedHazard(hz.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedHazard === hz.id
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/30'
                    : 'bg-[#0e1522] border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-xs text-white">{hz.title}</h4>
                  <SeverityBadge severity={hz.risk as any} />
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">{hz.desc}</p>
              </div>
            ))}
          </div>

          {/* Road Surface Visualization Canvas */}
          <div className="p-4 rounded-xl bg-[#090d15] border border-gray-800 flex flex-col items-center justify-center min-h-[140px] text-center">
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              Selected: {selectedHazard.replace(/_/g, ' ')}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Target Distance: <strong className="text-cyan-300 font-mono">{hazardDistance}m</strong> • Model Confidence: <strong className="text-emerald-400 font-mono">{(confidence * 100).toFixed(0)}%</strong>
            </p>
          </div>
        </div>

        {/* Hazard Customization Sliders */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Hazard Parameters
          </h3>

          {/* Distance Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Distance to Hazard:</span>
              <span className="font-mono text-cyan-300 font-bold">{hazardDistance.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="40.0"
              step="1.0"
              value={hazardDistance}
              onChange={(e) => setHazardDistance(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Severity Radio */}
          <div className="space-y-1.5 text-xs">
            <span className="text-gray-400 block font-medium">Reported Severity:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSeverityLevel('moderate')}
                className={`py-1.5 px-3 rounded-lg font-bold transition ${
                  severityLevel === 'moderate'
                    ? 'bg-amber-500 text-gray-950 font-black'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                Moderate
              </button>
              <button
                onClick={() => setSeverityLevel('severe')}
                className={`py-1.5 px-3 rounded-lg font-bold transition ${
                  severityLevel === 'severe'
                    ? 'bg-red-600 text-white font-black'
                    : 'bg-gray-800 text-gray-300'
                }`}
              >
                Severe
              </button>
            </div>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Detector Confidence:</span>
              <span className="font-mono text-cyan-300 font-bold">{(confidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <button
            onClick={handleTrigger}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs transition shadow-md shadow-amber-500/20"
          >
            Dispatch Hazard Evaluation
          </button>
        </div>
      </div>

      {/* Model Scope Limitation Disclosure */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          Model Transparency & Honest Disclosure
        </p>
        <p>
          Generic COCO object detection models detect vehicles and pedestrians, but do not natively classify potholes or subtle pavement cracks. AutoGuardian AI provides deterministic hazard simulation scenarios for these conditions and avoids fabricating synthetic detections. Real-world road-surface inspection requires dedicated high-resolution road segmentation models.
        </p>
      </div>
    </div>
  );
};
