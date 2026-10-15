import React, { useRef, useState } from 'react';
import {
  Scan,
  Upload,
  AlertCircle,
  CheckCircle,
  Layers,
  Cpu,
  Info,
  Car,
  User,
  Bike,
  Truck,
  Bus,
} from 'lucide-react';
import { ImageDetectionResponse, ObjectDetectionResult } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { api } from '../services/api';

interface ObjectDetectionPageProps {
  onRefreshEvents: () => void;
}

export const ObjectDetectionPage: React.FC<ObjectDetectionPageProps> = ({ onRefreshEvents }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<ImageDetectionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Invalid file format. Please upload a JPEG, PNG, or WebP image.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null);
      setErrorMsg(null);
    }
  };

  const runDetection = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const result = await api.uploadDetectionImage(selectedFile);
      setDetectionResult(result);
      onRefreshEvents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Image detection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Draw bounding boxes on canvas over the image
  const handleImageLoad = () => {
    if (!canvasRef.current || !imageRef.current || !detectionResult) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detectionResult.detections.forEach((det) => {
      const [ymin, xmin, ymax, xmax] = det.box_2d;
      const x = xmin * canvas.width;
      const y = ymin * canvas.height;
      const w = (xmax - xmin) * canvas.width;
      const h = (ymax - ymin) * canvas.height;

      // Box styling
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
      const labelText = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillRect(x, Math.max(0, y - 20), textWidth + 8, 20);

      // Label text
      ctx.fillStyle = '#0a0e17';
      ctx.fillText(labelText, x + 4, Math.max(14, y - 5));
    });
  };

  // Re-draw when detections update
  React.useEffect(() => {
    if (detectionResult) {
      handleImageLoad();
    }
  }, [detectionResult]);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111827] border border-[#1f2d47]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <Scan className="w-6 h-6 text-cyan-400" />
              Road & Object Detection (Genuine Neural Model)
            </h1>
            <StatusBadge mode={detectionResult?.mode || 'MODEL_PROCESSING'} />
          </div>
          <p className="text-xs md:text-sm text-gray-400">
            Powered by genuine pretrained YOLOv8 model running inference on CPU. Detects vehicles, pedestrians, cyclists, and obstacles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-gray-950 transition shadow-lg shadow-cyan-500/20">
            <Upload className="w-4 h-4" />
            Select Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <button
              onClick={runDetection}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              {isProcessing ? 'Analyzing...' : 'Run Neural Inference'}
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image & Bounding Box Canvas */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f2d47] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Visual Inspection Canvas
            </span>
            {detectionResult && (
              <span className="text-xs font-mono text-cyan-400">
                Model: {detectionResult.model_name}
              </span>
            )}
          </div>

          <div className="relative min-h-[340px] w-full rounded-xl bg-[#090d15] border border-gray-800 flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <div className="relative inline-block max-w-full">
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Upload road view"
                  onLoad={handleImageLoad}
                  className="max-h-[500px] w-auto max-w-full object-contain block mx-auto rounded-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none w-full h-full"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 max-w-sm">
                <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-300">No Image Uploaded</p>
                <p className="text-xs text-gray-500 mt-1 mb-4 leading-relaxed">
                  Upload a dashboard camera photo or street image to test real object detection bounding boxes and collision risk estimation.
                </p>
                <label className="cursor-pointer px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-cyan-400 text-xs font-bold border border-gray-700 transition">
                  Choose Test Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Model Disclosure */}
          <div className="mt-3 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Genuine neural predictions. Real bounding box vertices and COCO class confidences.</span>
            <span className="font-mono text-cyan-400">COCO 80-Class</span>
          </div>
        </div>

        {/* Detections Results Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center justify-between">
              <span>Detected Road Objects</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-cyan-400 font-mono">
                {detectionResult?.detections?.length || 0} Objects
              </span>
            </h3>

            {detectionResult?.summary && (
              <p className="text-xs text-gray-300 bg-[#0c121d] p-3 rounded-lg border border-gray-800 mb-4 leading-relaxed">
                {detectionResult.summary}
              </p>
            )}

            {!detectionResult ? (
              <p className="text-xs text-gray-500 italic py-4 text-center">
                Select an image and click 'Run Neural Inference' to view model outputs.
              </p>
            ) : detectionResult.detections.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 bg-[#0c121d] rounded-lg">
                No road objects matching target confidence threshold detected.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {detectionResult.detections.map((det, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#0c121d] border border-gray-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800">
                        {det.label.includes('Pedestrian') ? (
                          <User className="w-3.5 h-3.5" />
                        ) : det.label.includes('Bicycle') ? (
                          <Bike className="w-3.5 h-3.5" />
                        ) : det.label.includes('Truck') ? (
                          <Truck className="w-3.5 h-3.5" />
                        ) : det.label.includes('Bus') ? (
                          <Bus className="w-3.5 h-3.5" />
                        ) : (
                          <Car className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-white block">{det.label}</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          Proximity: {det.estimated_proximity_hint || 'MODERATE'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold font-mono text-cyan-400">
                        {(det.confidence * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-gray-500 block">confidence</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resulting Risk Event */}
          {detectionResult?.risk_event && (
            <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl p-5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">
                Unified Safety Engine Assessment
              </h4>
              <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 space-y-1.5 text-xs">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={detectionResult.risk_event.severity} />
                  <span className="font-mono text-gray-300">
                    Risk: <strong>{detectionResult.risk_event.risk_score}</strong>/100
                  </span>
                </div>
                <p className="font-bold text-white mt-1">{detectionResult.risk_event.title}</p>
                <p className="text-cyan-300/90 text-[11px] leading-relaxed">
                  {detectionResult.risk_event.explanation}
                </p>
                <p className="text-emerald-400 text-[11px] font-semibold">
                  {detectionResult.risk_event.guidance}
                </p>
              </div>
            </div>
          )}

          {/* Physical Distance Notice */}
          <div className="p-3.5 rounded-xl bg-[#0d131f] border border-gray-800 text-[11px] text-gray-400 leading-relaxed">
            <p className="font-bold text-gray-300 flex items-center gap-1.5 mb-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Optical Estimation Notice
            </p>
            <p>
              Bounding box size alone does not establish physical metric distance. AutoGuardian AI uses optical coverage heuristics for warning cues, but certifiable metric distance requires radar or calibrated stereo cameras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
