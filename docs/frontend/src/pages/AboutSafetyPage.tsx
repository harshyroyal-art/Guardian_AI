import React from 'react';
import {
  Shield,
  AlertTriangle,
  Users,
  Smartphone,
  Cpu,
  Lock,
  Compass,
  CheckCircle,
  FileText,
  Zap,
} from 'lucide-react';

export const AboutSafetyPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#121c2e] via-[#16233b] to-[#0d1624] border border-[#1f3152]">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-cyan-500 text-gray-950 font-bold shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              AutoGuardian AI
            </h1>
            <p className="text-xs md:text-sm text-cyan-400 font-medium">
              Intelligent Safety for Every Generation of Vehicle • NIAT Hackathon
            </p>
          </div>
        </div>
        <p className="text-xs md:text-sm text-gray-300 max-w-3xl leading-relaxed mt-2">
          An explainable, universal driver-assistance platform that supplements older retrofitted vehicles and modern vehicles with multi-modal vision, driver attention monitoring, simulated sensor arrays, and transparent risk assessments.
        </p>
      </div>

      {/* Strict Safety Scope Callout (Mandatory Alert) */}
      <div className="p-5 rounded-2xl bg-red-950/40 border-2 border-red-500/60 shadow-xl space-y-2">
        <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm uppercase tracking-wider">
          <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
          Mandatory Safety Boundary & Prototype Limitations
        </div>
        <p className="text-xs md:text-sm text-gray-200 leading-relaxed">
          <strong>AutoGuardian AI is strictly an advisory, warning-only software prototype.</strong> It NEVER implements automatic vehicle control and will NEVER interfere with steering, braking, throttle, ignition, or occupant safety restraints (airbags).
        </p>
        <ul className="text-xs text-gray-300 space-y-1 list-disc pl-5 pt-1">
          <li>Never test or interact with this application while operating a motor vehicle on public roads.</li>
          <li>All evaluations are performed on stationary laptops, stationary test benches, or prerecorded footage.</li>
          <li>Monocular optical measurements are uncalibrated and do not certify physical stopping distances.</li>
          <li>Full legal and physical driving responsibility remains exclusively with the human driver at all times.</li>
        </ul>
      </div>

      {/* Hackathon Project Pitch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Problem */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            The Safety Divide
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            Over 60% of vehicles currently on roads worldwide lack advanced driver-assistance systems (ADAS), such as forward collision warning, driver drowsiness detection, and blind-spot monitoring. High retrofit costs and proprietary OEM platforms leave everyday commuters and student drivers unprotected.
          </p>
        </div>

        {/* The Solution & Innovation */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-2">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            The AutoGuardian Innovation
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            The <strong>Explainable Unified Safety Intelligence Engine</strong> bridges the divide. It takes commodity camera feeds (laptops or smartphones over local Wi-Fi), runs lightweight neural object detection and facial landmarks, enforces duplicate alert cooldowns, and generates clear, human-understandable explanations for every alert.
          </p>
        </div>
      </div>

      {/* Team Division of Responsibilities */}
      <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Practical Hackathon Team Roles (3–5 Member Distribution)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0c121d] border border-gray-800 space-y-1">
            <span className="font-bold text-cyan-300 block">1. Frontend & Mobile UX Lead</span>
            <p className="text-gray-400">
              Builds responsive React dashboards, mobile drawer navigation, Recharts data visualizers, and Web Speech voice alerts.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0c121d] border border-gray-800 space-y-1">
            <span className="font-bold text-cyan-300 block">2. Computer Vision & ML Lead</span>
            <p className="text-gray-400">
              Integrates genuine YOLOv8/OpenCV object detectors, facial landmark EAR temporal calculations, and image upload pipeline.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0c121d] border border-gray-800 space-y-1">
            <span className="font-bold text-cyan-300 block">3. Backend & Risk Engine Lead</span>
            <p className="text-gray-400">
              Architects FastAPI REST endpoints, deterministic risk scoring algorithms, multi-threat prioritization, and duplicate suppression.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0c121d] border border-gray-800 space-y-1">
            <span className="font-bold text-cyan-300 block">4. Simulation & Diagnostics Lead</span>
            <p className="text-gray-400">
              Constructs interactive top-down blind-spot diagram, parking radar, simulated OBD-II fault codes, and 14 demo scenarios.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#0c121d] border border-gray-800 space-y-1">
            <span className="font-bold text-cyan-300 block">5. QA & Integration Engineer</span>
            <p className="text-gray-400">
              Executes automated pytest suites, verifies Android cross-device Wi-Fi communication, and authors technical documentation.
            </p>
          </div>
        </div>
      </div>

      {/* Android & Local Wi-Fi Access Guide */}
      <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          Laptop + Android Phone Wi-Fi Setup Guide
        </h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          AutoGuardian AI is engineered to run its backend and frontend on a student laptop while serving as an in-cockpit auxiliary display on any Android smartphone on the same local Wi-Fi network:
        </p>

        <div className="space-y-2 text-xs bg-[#0c121d] p-4 rounded-xl border border-gray-800 font-mono text-gray-300">
          <p><span className="text-cyan-400">Step 1:</span> Connect laptop and Android phone to the same trusted Wi-Fi network or phone hotspot.</p>
          <p><span className="text-cyan-400">Step 2:</span> In PowerShell on laptop, run <code className="text-amber-300">ipconfig</code> to find your IPv4 Address (e.g. 192.168.1.105).</p>
          <p><span className="text-cyan-400">Step 3:</span> On Android Chrome, browse to <code className="text-emerald-400">http://&lt;YOUR_LAPTOP_IP&gt;:5173</code>.</p>
          <p><span className="text-cyan-400">Step 4 (Troubleshooting):</span> If the page fails to load, verify Windows Firewall allows inbound connections on ports 5173 and 8000 for Private Networks.</p>
        </div>
      </div>

      {/* Privacy Policy */}
      <div className="p-4 rounded-xl bg-[#0d131f] border border-gray-800 text-xs text-gray-400 leading-relaxed space-y-1">
        <p className="font-bold text-gray-300 flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-cyan-400" />
          Privacy By Design
        </p>
        <p>
          AutoGuardian AI processes all camera streams strictly within local client RAM. No video frames, driver facial biometrics, or camera recordings are saved to persistent disk or transmitted to cloud servers. When monitoring stops, all camera hardware tracks are terminated immediately.
        </p>
      </div>
    </div>
  );
};
