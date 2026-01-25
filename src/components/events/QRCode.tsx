"use client";

import { useEffect, useRef, useState } from "react";
import { QrCode, Download, Share2, Copy, Check } from "lucide-react";

interface QRCodeGeneratorProps {
  data: string;
  size?: number;
  title?: string;
  subtitle?: string;
}

export function QRCodeGenerator({
  data,
  size = 200,
  title,
  subtitle,
}: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (canvasRef.current && data) {
      // Using a simple QR code generation approach
      // In production, you'd use a library like 'qrcode'
      generateQRCode(canvasRef.current, data, size);
    }
  }, [data, size]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `ticket-${Date.now()}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && canvasRef.current) {
      try {
        const blob = await new Promise<Blob>((resolve) => {
          canvasRef.current!.toBlob((b) => resolve(b!), "image/png");
        });
        const file = new File([blob], "ticket.png", { type: "image/png" });
        await navigator.share({
          title: title || "Event Ticket",
          text: subtitle || "My event ticket",
          files: [file],
        });
      } catch (err) {
        console.error("Share failed:", err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* QR Code display */}
      <div className="bg-white p-4 rounded-2xl shadow-lg">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>

      {/* Title and subtitle */}
      {(title || subtitle) && (
        <div className="mt-4 text-center">
          {title && <p className="text-lg font-semibold text-white">{title}</p>}
          {subtitle && <p className="text-sm text-dark-300">{subtitle}</p>}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Save
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl transition-colors text-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl transition-colors text-sm"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
      </div>
    </div>
  );
}

// Simple QR code generator using canvas
// For production, use a proper library like 'qrcode'
function generateQRCode(canvas: HTMLCanvasElement, data: string, size: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Generate a simple pattern (placeholder)
  // In production, use: import QRCode from 'qrcode'; QRCode.toCanvas(canvas, data);
  const qrSize = Math.floor(size / 25);
  const matrix = generateQRMatrix(data);

  ctx.fillStyle = "#000000";
  matrix.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        ctx.fillRect(
          x * qrSize + qrSize * 2,
          y * qrSize + qrSize * 2,
          qrSize,
          qrSize
        );
      }
    });
  });

  // Add finder patterns (corners)
  drawFinderPattern(ctx, qrSize * 2, qrSize * 2, qrSize);
  drawFinderPattern(ctx, size - qrSize * 9, qrSize * 2, qrSize);
  drawFinderPattern(ctx, qrSize * 2, size - qrSize * 9, qrSize);
}

function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number
) {
  // Outer square
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y, cellSize * 7, cellSize * 7);

  // White inner
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x + cellSize, y + cellSize, cellSize * 5, cellSize * 5);

  // Black center
  ctx.fillStyle = "#000000";
  ctx.fillRect(x + cellSize * 2, y + cellSize * 2, cellSize * 3, cellSize * 3);
}

function generateQRMatrix(data: string): boolean[][] {
  // Simple hash-based pattern generation (placeholder)
  // Real QR codes use Reed-Solomon error correction
  const size = 21;
  const matrix: boolean[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(false));

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash = hash & hash;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Skip finder pattern areas
      if (
        (x < 8 && y < 8) ||
        (x < 8 && y >= size - 8) ||
        (x >= size - 8 && y < 8)
      ) {
        continue;
      }
      matrix[y][x] = ((hash * (x + 1) * (y + 1)) % 100) > 50;
    }
  }

  return matrix;
}

// QR Code ticket component
export function EventTicket({
  qrData,
  eventTitle,
  eventDate,
  userName,
  status,
}: {
  qrData: string;
  eventTitle: string;
  eventDate: string;
  userName: string;
  status: string;
}) {
  return (
    <div className="glass rounded-3xl overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-600 to-accent-500 p-6 text-center">
        <QrCode className="w-8 h-8 text-white/80 mx-auto mb-2" />
        <h3 className="text-xl font-bold text-white">{eventTitle}</h3>
        <p className="text-white/80 text-sm mt-1">{eventDate}</p>
      </div>

      {/* QR Code */}
      <div className="p-6 bg-dark-800">
        <QRCodeGenerator data={qrData} size={180} />
      </div>

      {/* Footer */}
      <div className="p-4 bg-dark-900 border-t border-dark-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark-400">Attendee</p>
            <p className="text-white font-medium">{userName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-dark-400">Status</p>
            <p
              className={`font-medium capitalize ${
                status === "going"
                  ? "text-green-400"
                  : status === "waitlist"
                  ? "text-blue-400"
                  : "text-amber-400"
              }`}
            >
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
