"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

interface FloatingCard {
  id: number;
  name: string;
  members: number;
  color: string;
  x: number;
  y: number;
  delay: number;
}

const mockCards: FloatingCard[] = [
  { id: 1, name: "Tech Society", members: 234, color: "#8b5cf6", x: 10, y: 20, delay: 0 },
  { id: 2, name: "Art Club", members: 156, color: "#22d3ee", x: 75, y: 15, delay: 1 },
  { id: 3, name: "Music Circle", members: 312, color: "#f472b6", x: 85, y: 60, delay: 2 },
  { id: 4, name: "Debate Team", members: 89, color: "#34d399", x: 5, y: 70, delay: 1.5 },
  { id: 5, name: "Film Society", members: 201, color: "#fbbf24", x: 70, y: 80, delay: 0.5 },
  { id: 6, name: "Chess Club", members: 67, color: "#f87171", x: 20, y: 85, delay: 2.5 },
];

export function FloatingCards() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {mockCards.map((card) => (
        <div
          key={card.id}
          className="absolute opacity-20 hover:opacity-40 transition-opacity duration-500"
          style={{
            left: `${card.x}%`,
            top: `${card.y}%`,
            animation: `float 6s ease-in-out ${card.delay}s infinite`,
          }}
        >
          <div
            className="glass-light rounded-2xl p-4 min-w-[140px]"
            style={{
              boxShadow: `0 0 30px ${card.color}20`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl mb-2 flex items-center justify-center"
              style={{ backgroundColor: `${card.color}20` }}
            >
              <Users className="w-5 h-5" style={{ color: card.color }} />
            </div>
            <p className="text-sm font-medium text-white/80">{card.name}</p>
            <p className="text-xs text-white/50">{card.members} members</p>
          </div>
        </div>
      ))}
    </div>
  );
}
