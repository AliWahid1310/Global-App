"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { checkInViaQR } from "@/lib/actions/events";
import {
  Camera,
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Flashlight,
  SwitchCamera,
} from "lucide-react";

interface QRScannerProps {
  eventCode: string;
  onCheckIn?: (result: {
    success: boolean;
    user?: { full_name: string; email: string };
    error?: string;
  }) => void;
}

export function QRScanner({ eventCode, onCheckIn }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    userName?: string;
    error?: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please grant camera permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const switchCamera = async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    if (scanning) {
      stopCamera();
      setTimeout(() => startCamera(), 100);
    }
  };

  const processQRCode = async (qrData: string) => {
    if (processing) return;

    // Validate format: eventCode:userId
    const parts = qrData.split(":");
    if (parts.length !== 2) {
      setResult({ success: false, error: "Invalid QR code format" });
      return;
    }

    const [scannedEventCode, userId] = parts;

    // Verify event code matches
    if (scannedEventCode !== eventCode) {
      setResult({ success: false, error: "QR code is for a different event" });
      return;
    }

    setProcessing(true);

    try {
      const checkInResult = await checkInViaQR(eventCode, userId);

      if ("error" in checkInResult && checkInResult.error) {
        setResult({ success: false, error: checkInResult.error });
      } else if ("success" in checkInResult && checkInResult.success) {
        const successResult = checkInResult as { success: boolean; user: { full_name: string | null; email: string }; event: { id: string; title: string } };
        setResult({
          success: true,
          userName: successResult.user?.full_name || "Unknown",
        });
        onCheckIn?.({
          success: true,
          user: successResult.user as { full_name: string; email: string },
        });
      }
    } catch (err) {
      setResult({ success: false, error: "Failed to process check-in" });
    } finally {
      setProcessing(false);
    }
  };

  // Manual input for testing or fallback
  const [manualCode, setManualCode] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      processQRCode(manualCode.trim());
    }
  };

  const resetScanner = () => {
    setResult(null);
    setManualCode("");
  };

  return (
    <div className="space-y-6">
      {/* Camera view */}
      <div className="relative aspect-square max-w-md mx-auto bg-dark-800 rounded-2xl overflow-hidden">
        {scanning ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-accent-400 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-accent-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-accent-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-accent-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-accent-400 rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute inset-x-2 h-0.5 bg-accent-400 animate-scan" />
              </div>
            </div>
            {/* Camera controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              <button
                onClick={switchCamera}
                className="p-3 bg-dark-900/80 backdrop-blur rounded-full text-white hover:bg-dark-800 transition-colors"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
              <button
                onClick={stopCamera}
                className="p-3 bg-red-500/80 backdrop-blur rounded-full text-white hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6">
            <QrCode className="w-16 h-16 text-dark-500 mb-4" />
            <p className="text-dark-300 text-center mb-4">
              Position the QR code within the frame to scan
            </p>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-colors font-medium"
            >
              <Camera className="w-5 h-5" />
              Start Camera
            </button>
          </div>
        )}

        {/* Processing overlay */}
        {processing && (
          <div className="absolute inset-0 bg-dark-900/80 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-accent-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Result display */}
      {result && (
        <div
          className={`p-6 rounded-xl text-center ${
            result.success
              ? "bg-green-500/20 border border-green-500/30"
              : "bg-red-500/20 border border-red-500/30"
          }`}
        >
          {result.success ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-400 mb-1">
                Check-in Successful!
              </h3>
              <p className="text-white">{result.userName}</p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-red-400 mb-1">
                Check-in Failed
              </h3>
              <p className="text-dark-300">{result.error}</p>
            </>
          )}
          <button
            onClick={resetScanner}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Scan Another
          </button>
        </div>
      )}

      {/* Manual input fallback */}
      {!result && (
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-dark-300 mb-3 text-center">
            Or enter ticket code manually:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter ticket code..."
              className="flex-1 px-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <button
              type="submit"
              disabled={processing || !manualCode.trim()}
              className="px-4 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      <style jsx>{`
        @keyframes scan {
          0%,
          100% {
            top: 0.5rem;
          }
          50% {
            top: calc(100% - 0.5rem);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
