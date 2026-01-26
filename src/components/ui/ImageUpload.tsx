"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  aspectRatio?: "square" | "banner";
  placeholder?: string;
  currentImage?: string;
}

export function ImageUpload({
  onFileSelect,
  aspectRatio = "square",
  placeholder = "Upload image",
  currentImage,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
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

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileSelect(file);
    } else {
      setPreview(null);
      onFileSelect(null);
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    handleFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const heightClass = aspectRatio === "banner" ? "h-32" : "h-40";

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
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
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              clearImage();
            }}
            className="absolute top-2 right-2 p-1.5 bg-dark-900/80 rounded-full text-white hover:bg-dark-900 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-dark-400 cursor-pointer">
          <Upload className="h-8 w-8 mb-2" />
          <span className="text-sm text-dark-300">{placeholder}</span>
          <span className="text-xs text-dark-500 mt-1">
            Drag & drop or click to browse
          </span>
        </div>
      )}
    </div>
  );
}
