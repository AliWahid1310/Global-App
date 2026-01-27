"use client";

import { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";
import { X, ZoomIn, ZoomOut, RotateCcw, Check } from "lucide-react";

interface ImageCropperProps {
  image: string;
  aspectRatio: number;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
  originalFileName: string;
}

export function ImageCropper({
  image,
  aspectRatio,
  onCropComplete,
  onCancel,
  originalFileName,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((location: Point) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 1));
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const createCroppedImage = async (): Promise<File | null> => {
    if (!croppedAreaPixels) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        // Set canvas size to cropped area
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Draw the cropped image
        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create file from blob with original filename
              const extension = originalFileName.split(".").pop() || "jpg";
              const baseName = originalFileName.replace(/\.[^/.]+$/, "");
              const file = new File([blob], `${baseName}_cropped.${extension}`, {
                type: blob.type,
              });
              resolve(file);
            } else {
              resolve(null);
            }
          },
          "image/jpeg",
          0.9
        );
      };
      img.crossOrigin = "anonymous";
      img.src = image;
    });
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const croppedFile = await createCroppedImage();
      if (croppedFile) {
        onCropComplete(croppedFile);
      }
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-dark-900 rounded-2xl overflow-hidden shadow-2xl border border-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white">Crop Image</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cropper Area */}
        <div className="relative h-[50vh] sm:h-[60vh] bg-dark-950">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            cropShape={aspectRatio === 1 ? "round" : "rect"}
            showGrid={true}
            style={{
              containerStyle: {
                background: "rgb(3, 7, 18)",
              },
              cropAreaStyle: {
                border: "2px solid rgba(139, 92, 246, 0.8)",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
              },
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-4 bg-dark-850 border-t border-dark-700">
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomOut className="h-5 w-5" />
            </button>

            {/* Zoom Slider */}
            <div className="flex-1 max-w-xs flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-dark-500" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-accent-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
              />
              <ZoomIn className="h-4 w-4 text-dark-500" />
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomIn className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-all ml-2"
              title="Reset"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          {/* Instructions */}
          <p className="text-center text-dark-400 text-sm mb-4">
            Drag to reposition • Pinch or scroll to zoom
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-dark-600 text-dark-200 rounded-xl hover:bg-dark-800 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Apply Crop
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
