import React, { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Battery,
  Thermometer,
  Cpu,
  CheckCircle,
  AlertOctagon,
  Info,
  Play,
  RotateCcw,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface DiagnosticsPageProps {
  onRefreshEvents: () => void;
}

const COMMON_DTCS = [
  {
    code: 'P0300',
    title: 'Random / Multiple Cylinder Misfire Detected',
    system: 'Powertrain Ignition',
    severity: 'CRITICAL',
    advice: 'May damage catalytic converter. Inspect spark plugs, ignition coils, and fuel delivery.',
  },
  {
    code: 'P0217',
    title: 'Engine Coolant Over-Temperature Condition',
    system: 'Thermal Management',
    severity: 'CRITICAL',
    advice: 'Severe engine damage risk. Stop vehicle safely and check coolant level after engine cools.',
  },
  {
    code: 'P0524',
    title: 'Engine Oil Pressure Too Low',
    system: 'Lubrication',
    severity: 'CRITICAL',
    advice: 'Critical engine lubrication loss. Turn off ignition immediately and check oil level.',
  },
  {
    code: 'P0117',
    title: 'Engine Coolant Temperature Sensor 1 Circuit Low',
    system: 'Thermal Sensor',
    severity: 'MEDIUM',
    advice: 'Faulty coolant sensor reading. Verify electrical wiring harness and sensor resistance.',
  },
  {
    code: 'P0420',
    title: 'Catalyst System Efficiency Below Threshold (Bank 1)',
    system: 'Emissions',
    severity: 'LOW',
    advice: 'Vehicle remains drivable. Schedule emissions inspection and catalytic converter test.',
  },
];

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({ onRefreshEvents }) => {
  const [checkEngine, setCheckEngine] = useState<boolean>(true);
  const [engineTempC, setEngineTempC] = useState<number>(108.0);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(12.2);
  const [activeCodes, setActiveCodes] = useState<string[]>(['P0300', 'P0117']);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleUpdate = async (updates: {
    check_engine_light?: boolean;
    engine_temp_c?: number;
    battery_voltage?: number;
    active_dtc_codes?: string[];
  }) => {
    setIsUpdating(true);
    try {
      await api.updateDiagnostics(updates);
      onRefreshEvents();
    } catch {
      // Handled silently
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleDtc = (code: string) => {
    const updated = activeCodes.includes(code)
      ? activeCodes.filter((c) => c !== code)
      : [...activeCodes, code];
    setActiveCodes(updated);
    setCheckEngine(updated.length > 0);
    handleUpdate({ active_dtc_codes: updated, check_engine_light: updated.length > 0 });
  };

  const resetNominal = () => {
    setCheckEngine(false);
    setEngineTempC(90.0);
    setBatteryVoltage(12.6);
    setActiveCodes([]);
    handleUpdate({
      check_engine_light: false,
      engine_temp_c: 90.0,
      battery_voltage: 12.6,
      active_dtc_codes: [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-cyan-400" />
              Vehicle Telemetry & Diagnostics (OBD-II)
            </h1>
            <StatusBadge mode="DEMO_SIMULATION" />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Simulated OBD-II powertrain telemetry, diagnostic trouble code (DTC) evaluation, and explainable maintenance guidance.
          </p>
        </div>

        <button
          onClick={resetNominal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition"
        >
          <RotateCcw className="w-4 h-4 text-cyan-400" />
          Reset Telemetry to Nominal
        </button>
      </div>

      {/* Primary Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Check Engine Light */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            checkEngine
              ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-950/30'
              : 'bg-[#131c2d] border-[#1f2d47]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Malfunction Lamp</span>
            <AlertTriangle className={`w-5 h-5 ${checkEngine ? 'text-amber-400 animate-pulse' : 'text-gray-600'}`} />
          </div>
          <div className="text-xl font-bold text-white my-2">
            {checkEngine ? 'CHECK ENGINE (MIL ON)' : 'OFF (Nominal)'}
          </div>
          <p className="text-[11px] text-gray-400">
            Active DTC count: <strong className="text-white">{activeCodes.length}</strong>
          </p>
        </div>

        {/* Engine Coolant Temp */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            engineTempC >= 105
              ? 'bg-red-950/40 border-red-500'
              : 'bg-[#131c2d] border-[#1f2d47]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Engine Coolant Temp</span>
            <Thermometer className={`w-5 h-5 ${engineTempC >= 105 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
          </div>
          <div className="text-2xl font-black text-white my-2 font-mono">
            {engineTempC.toFixed(1)}°C
          </div>
          <p className="text-[11px] text-gray-400">
            Nominal Range: 85°C – 100°C
          </p>
        </div>

        {/* Battery Bus Voltage */}
        <div
          className={`p-4 rounded-xl border flex flex-col justify-between ${
            batteryVoltage < 11.5
              ? 'bg-red-950/40 border-red-500'
              : 'bg-[#131c2d] border-[#1f2d47]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">12V Bus Voltage</span>
            <Battery className={`w-5 h-5 ${batteryVoltage < 11.5 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className="text-2xl font-black text-white my-2 font-mono">
            {batteryVoltage.toFixed(1)} V
          </div>
          <p className="text-[11px] text-gray-400">
            Alternator nominal: 13.8V – 14.4V
          </p>
        </div>

        {/* OBD-II Connection Interface */}
        <div className="p-4 rounded-xl bg-[#131c2d] border border-[#1f2d47] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Adapter Interface</span>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-base font-bold text-white my-2">
            Simulated OBD-II
          </div>
          <p className="text-[11px] text-cyan-400 font-mono">
            ELM327 Bluetooth (Ready)
          </p>
        </div>
      </div>

      {/* Main Grid: Active DTCs & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Codes & Remediation */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-cyan-400" />
              Active Diagnostic Fault Codes (DTC)
            </h3>
            <span className="text-xs font-mono text-gray-400">
              Protocol: SAE J1979 / ISO 15765-4
            </span>
          </div>

          {activeCodes.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-[#0c121d] rounded-xl border border-dashed border-gray-800">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-semibold text-gray-300">No Active Fault Codes</p>
              <p className="text-xs text-gray-500 mt-1">
                Powertrain, emissions, and electrical sub-controllers report zero pending or stored fault codes.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeCodes.map((code) => {
                const info = COMMON_DTCS.find((d) => d.code === code) || {
                  code,
                  title: 'Generic Diagnostic Fault Code',
                  system: 'Vehicle Subsystem',
                  severity: 'MEDIUM',
                  advice: 'Inspect related subsystem with diagnostic scanner.',
                };
                return (
                  <div
                    key={code}
                    className="p-4 rounded-xl bg-[#0c121d] border border-gray-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 font-mono font-bold text-xs">
                          {info.code}
                        </span>
                        <span className="text-xs font-bold text-white">{info.title}</span>
                      </div>
                      <SeverityBadge severity={info.severity as any} />
                    </div>

                    <p className="text-xs text-gray-400">
                      <span className="font-semibold text-gray-300">Subsystem:</span> {info.system}
                    </p>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-cyan-300">
                      <span className="font-bold text-gray-300">Follow-up Guidance:</span> {info.advice}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Diagnostic Fault Injection Lab */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-sm text-white">
            Fault Injection Simulator
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Toggle simulated DTC codes to test the risk engine's prioritization and diagnostic warning alerts.
          </p>

          <div className="space-y-2">
            {COMMON_DTCS.map((dtc) => {
              const active = activeCodes.includes(dtc.code);
              return (
                <button
                  key={dtc.code}
                  onClick={() => toggleDtc(dtc.code)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                    active
                      ? 'bg-amber-950/50 border-amber-500 text-white font-bold'
                      : 'bg-gray-800/60 border-gray-700 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div>
                    <span className="font-mono text-cyan-400 block">{dtc.code}</span>
                    <span className="text-[11px] text-gray-300 truncate max-w-[170px] block">
                      {dtc.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      active ? 'bg-amber-500 text-gray-950 font-black' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {active ? 'ACTIVE' : 'INJECT'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Engine Temp Adjustment Slider */}
          <div className="pt-2 border-t border-gray-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Coolant Temp:</span>
              <span className="font-mono text-cyan-300 font-bold">{engineTempC.toFixed(0)}°C</span>
            </div>
            <input
              type="range"
              min="75"
              max="125"
              step="1"
              value={engineTempC}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setEngineTempC(val);
                handleUpdate({ engine_temp_c: val });
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Hardware Interface & Future Scope Disclaimer */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed">
        <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
          <Info className="w-4 h-4 text-cyan-400" />
          OBD-II Integration Architecture & Honest Disclosure
        </p>
        <p>
          All diagnostic codes and engine parameters shown on this page are deterministic simulated telemetry. AutoGuardian AI provides an extensible Bluetooth / Wi-Fi ELM327 interface designed for vehicle diagnostic ports, but will never claim an active physical vehicle connection without an actual hardware dongle linked.
        </p>
      </div>
    </div>
  );
};
