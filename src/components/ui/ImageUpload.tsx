"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Crop } from "lucide-react";
import { ImageCropper } from "./ImageCropper";

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  onRemove?: () => void;
  aspectRatio?: "square" | "banner";
  placeholder?: string;
  currentImage?: string;
}

export function ImageUpload({
  onFileSelect,
  onRemove,
  aspectRatio = "square",
  placeholder = "Upload image",
  currentImage,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync preview with currentImage prop changes
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);

  // Get aspect ratio number for cropper
  const getAspectRatio = () => {
    switch (aspectRatio) {
      case "square":
        return 1;
      case "banner":
        return 16 / 9;
      default:
        return 1;
    }
  };

  const handleFileSelection = (file: File | null) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB");
        return;
      }

      // Store original filename
      setOriginalFileName(file.name);

      // Read file and open cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    // Create preview from cropped file
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);

    // Pass cropped file to parent
    onFileSelect(croppedFile);
    setShowCropper(false);
    setOriginalImage(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setOriginalImage(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    onFileSelect(null);
    onRemove?.();
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleEditCrop = () => {
    // Re-open cropper with current preview
    if (preview) {
      setOriginalImage(preview);
      setShowCropper(true);
    }
  };

  const heightClass = aspectRatio === "banner" ? "h-32" : "h-40";

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <div
        className={`relative ${heightClass} border-2 border-dashed rounded-xl transition-all ${
          dragActive
            ? "border-accent-500 bg-accent-500/10"
            : "border-dark-600 hover:border-dark-500 bg-dark-800/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={!preview ? handleClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-full">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover rounded-xl"
            />
            <div className="absolute top-2 right-2 flex gap-1.5 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditCrop();
                }}
                className="p-1.5 bg-dark-900/80 rounded-full text-white hover:bg-dark-900 transition-all"
                title="Edit crop"
              >
                <Crop className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearImage();
                }}
                className="p-1.5 bg-dark-900/80 rounded-full text-white hover:bg-dark-900 transition-all"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full text-dark-400 cursor-pointer px-4 py-4">
            <Upload className="h-6 w-6 sm:h-8 sm:w-8 mb-2 flex-shrink-0" />
            <span className="text-sm text-dark-300 text-center">{placeholder}</span>
            <span className="text-xs text-dark-500 mt-1 text-center">
              Drag & drop or click to browse
            </span>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {showCropper && originalImage && (
        <ImageCropper
          image={originalImage}
          aspectRatio={getAspectRatio()}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          originalFileName={originalFileName || "image.jpg"}
        />
      )}
    </>
  );
}
