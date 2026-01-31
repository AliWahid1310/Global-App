"use client";

import Image from "next/image";
import { User, Crown, Star, Briefcase, Users2, UserCircle } from "lucide-react";
import type { SocietyPositionWithUser, HierarchyLevel } from "@/types/database";

interface HierarchyTreeProps {
  positions: SocietyPositionWithUser[];
}

const levelConfig: Record<HierarchyLevel, {
  label: string;
  icon: typeof Crown;
  gradient: string;
  glow: string;
  borderColor: string;
}> = {
  president: {
    label: "President",
    icon: Crown,
    gradient: "from-amber-500 to-yellow-500",
    glow: "shadow-amber-500/40",
    borderColor: "border-amber-500/50",
  },
  vice_president: {
    label: "Vice President",
    icon: Star,
    gradient: "from-purple-500 to-violet-500",
    glow: "shadow-purple-500/30",
    borderColor: "border-purple-500/50",
  },
  executive: {
    label: "Executive",
    icon: Briefcase,
    gradient: "from-accent-500 to-accent-600",
    glow: "shadow-accent-500/30",
    borderColor: "border-accent-500/50",
  },
  director: {
    label: "Director",
    icon: Users2,
    gradient: "from-cyan-500 to-teal-500",
    glow: "shadow-cyan-500/30",
    borderColor: "border-cyan-500/50",
  },
  deputy_director: {
    label: "Deputy Director",
    icon: UserCircle,
    gradient: "from-emerald-500 to-green-500",
    glow: "shadow-emerald-500/30",
    borderColor: "border-emerald-500/50",
  },
};

function PositionCard({ position }: { position: SocietyPositionWithUser }) {
  const config = levelConfig[position.hierarchy_level];
  const Icon = config.icon;
  const displayTitle = position.custom_title || config.label;

  return (
    <div className="relative group">
      {/* Glow effect on hover */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${config.gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
      
      {/* Card */}
      <div className={`relative glass rounded-2xl p-4 border ${config.borderColor} hover:border-opacity-100 transition-all duration-300 hover:scale-105`}>
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className={`relative w-20 h-20 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-dark-900 ${config.borderColor} shadow-lg ${config.glow}`}>
            {position.user?.avatar_url ? (
              <Image
                src={position.user.avatar_url}
                alt={position.user.full_name || "Member"}
                fill
                className="object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          
          {/* Role badge */}
          <div className={`-mt-3 px-3 py-1 bg-gradient-to-r ${config.gradient} rounded-full flex items-center gap-1.5 shadow-lg ${config.glow}`}>
            <Icon className="w-3 h-3 text-white" />
            <span className="text-xs font-semibold text-white whitespace-nowrap">{displayTitle}</span>
          </div>
          
          {/* Name */}
          <h4 className="mt-3 text-sm font-semibold text-white text-center">
            {position.user?.full_name || "Vacant"}
          </h4>
          
          {/* Position title if custom */}
          {position.custom_title && position.custom_title !== config.label && (
            <p className="text-xs text-dark-300 text-center mt-0.5">
              {position.position_title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectorLine({ type }: { type: "vertical" | "horizontal" | "branch-left" | "branch-right" | "branch-center" }) {
  if (type === "vertical") {
    return (
      <div className="flex justify-center">
        <div className="w-0.5 h-8 bg-gradient-to-b from-accent-500/60 to-accent-500/20" />
      </div>
    );
  }
  
  if (type === "horizontal") {
    return (
      <div className="h-0.5 bg-gradient-to-r from-accent-500/20 via-accent-500/60 to-accent-500/20" />
    );
  }
  
  return null;
}

function TreeLevel({ 
  positions, 
  level 
}: { 
  positions: SocietyPositionWithUser[]; 
  level: HierarchyLevel;
}) {
  const levelPositions = positions
    .filter(p => p.hierarchy_level === level)
    .sort((a, b) => a.display_order - b.display_order);
  
  if (levelPositions.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {levelPositions.map((position) => (
        <PositionCard key={position.id} position={position} />
      ))}
    </div>
  );
}

export function HierarchyTree({ positions }: HierarchyTreeProps) {
  if (positions.length === 0) {
    return (
      <div className="glass-light rounded-2xl p-10 text-center">
        <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-dark-400" />
        </div>
        <p className="text-dark-300 text-lg">No leadership positions defined</p>
        <p className="text-dark-400 text-sm mt-1">The society hierarchy will appear here</p>
      </div>
    );
  }

  const levels: HierarchyLevel[] = ["president", "vice_president", "executive", "director", "deputy_director"];
  const hasLevel = (level: HierarchyLevel) => positions.some(p => p.hierarchy_level === level);

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-radial from-accent-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative space-y-2">
        {levels.map((level, index) => {
          if (!hasLevel(level)) return null;
          
          const nextLevelIndex = levels.slice(index + 1).findIndex(l => hasLevel(l));
          const hasNextLevel = nextLevelIndex !== -1;
          
          return (
            <div key={level}>
              <TreeLevel positions={positions} level={level} />
              {hasNextLevel && <ConnectorLine type="vertical" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
