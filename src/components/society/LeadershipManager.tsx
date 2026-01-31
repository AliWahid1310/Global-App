"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Crown, 
  Star, 
  Briefcase, 
  Users2, 
  UserCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Loader2,
  User,
  Calendar,
  Check
} from "lucide-react";
import { format } from "date-fns";
import { 
  addLeadershipPosition, 
  updateLeadershipPosition, 
  deleteLeadershipPosition,
  getSocietyMembers 
} from "@/lib/actions/leadership";
import type { SocietyPositionWithUser, HierarchyLevel, Profile } from "@/types/database";

interface LeadershipManagerProps {
  societyId: string;
  societySlug: string;
  positions: SocietyPositionWithUser[];
}

type SimpleMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

const hierarchyLevels: { value: HierarchyLevel; label: string; icon: typeof Crown }[] = [
  { value: "president", label: "President", icon: Crown },
  { value: "vice_president", label: "Vice President", icon: Star },
  { value: "executive", label: "Executive", icon: Briefcase },
  { value: "director", label: "Director", icon: Users2 },
  { value: "deputy_director", label: "Deputy Director", icon: UserCircle },
];

const levelColors: Record<HierarchyLevel, string> = {
  president: "from-amber-500 to-yellow-500",
  vice_president: "from-purple-500 to-violet-500",
  executive: "from-accent-500 to-accent-600",
  director: "from-cyan-500 to-teal-500",
  deputy_director: "from-emerald-500 to-green-500",
};

interface PositionFormData {
  userId: string | null;
  positionTitle: string;
  hierarchyLevel: HierarchyLevel;
  customTitle: string;
  tenureStart: string;
  tenureEnd: string;
  isPresent: boolean;
}

const initialFormData: PositionFormData = {
  userId: null,
  positionTitle: "",
  hierarchyLevel: "president",
  customTitle: "",
  tenureStart: "",
  tenureEnd: "",
  isPresent: true,
};

// Convert "2026-03" to "2026-03-01" for database DATE type
function monthToDate(monthStr: string | null): string | null {
  if (!monthStr) return null;
  return `${monthStr}-01`;
}

// Convert "2026-03-01" back to "2026-03" for month input
function dateToMonth(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.substring(0, 7);
}

// Make error messages user-friendly
function getUserFriendlyError(error: string): string {
  if (error.includes("invalid input syntax for type date")) {
    return "Please select a valid date for the tenure period.";
  }
  if (error.includes("duplicate key") || error.includes("unique constraint")) {
    return "This person already has a position at this level.";
  }
  if (error.includes("Not authenticated")) {
    return "Please log in to manage leadership positions.";
  }
  return error;
}

export function LeadershipManager({ societyId, societySlug, positions }: LeadershipManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<SocietyPositionWithUser | null>(null);
  const [formData, setFormData] = useState<PositionFormData>(initialFormData);
  const [members, setMembers] = useState<SimpleMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load members when modal opens
  useEffect(() => {
    if (isModalOpen && members.length === 0) {
      loadMembers();
    }
  }, [isModalOpen]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    const result = await getSocietyMembers(societyId);
    if (result.members) {
      setMembers(result.members);
    }
    setLoadingMembers(false);
  };

  const openAddModal = () => {
    setEditingPosition(null);
    setFormData(initialFormData);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (position: SocietyPositionWithUser) => {
    setEditingPosition(position);
    setFormData({
      userId: position.user_id,
      positionTitle: position.position_title,
      hierarchyLevel: position.hierarchy_level,
      customTitle: position.custom_title || "",
      tenureStart: dateToMonth(position.tenure_start),
      tenureEnd: dateToMonth(position.tenure_end),
      isPresent: !position.tenure_end,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPosition(null);
    setFormData(initialFormData);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate tenure dates are not in the future
    const currentMonth = new Date().toISOString().substring(0, 7); // "2026-01"
    
    if (formData.tenureStart && formData.tenureStart > currentMonth) {
      setError("Start date cannot be in the future. Please select a valid date.");
      setLoading(false);
      return;
    }
    
    if (formData.tenureEnd && formData.tenureEnd > currentMonth) {
      setError("End date cannot be in the future. Please select a valid date.");
      setLoading(false);
      return;
    }
    
    if (formData.tenureStart && formData.tenureEnd && formData.tenureEnd < formData.tenureStart) {
      setError("End date cannot be before start date.");
      setLoading(false);
      return;
    }

    const selectedLevel = hierarchyLevels.find(l => l.value === formData.hierarchyLevel);
    const positionTitle = formData.customTitle || selectedLevel?.label || formData.hierarchyLevel;

    if (editingPosition) {
      // Update existing
      const result = await updateLeadershipPosition({
        positionId: editingPosition.id,
        societySlug,
        userId: formData.userId,
        positionTitle,
        hierarchyLevel: formData.hierarchyLevel,
        customTitle: formData.customTitle || null,
        tenureStart: monthToDate(formData.tenureStart),
        tenureEnd: formData.isPresent ? null : monthToDate(formData.tenureEnd),
      });

      if (result.error) {
        setError(getUserFriendlyError(result.error));
      } else {
        closeModal();
      }
    } else {
      // Add new
      const result = await addLeadershipPosition({
        societyId,
        societySlug,
        userId: formData.userId,
        positionTitle,
        hierarchyLevel: formData.hierarchyLevel,
        customTitle: formData.customTitle || null,
        tenureStart: monthToDate(formData.tenureStart),
        tenureEnd: formData.isPresent ? null : monthToDate(formData.tenureEnd),
      });

      if (result.error) {
        setError(getUserFriendlyError(result.error));
      } else {
        closeModal();
      }
    }

    setLoading(false);
  };

  const handleDelete = async (positionId: string) => {
    setLoading(true);
    const result = await deleteLeadershipPosition(positionId, societySlug);
    if (result.error) {
      setError(result.error);
    }
    setDeleteConfirm(null);
    setLoading(false);
  };

  const getLevelIcon = (level: HierarchyLevel) => {
    const config = hierarchyLevels.find(l => l.value === level);
    return config?.icon || Crown;
  };

  // Group positions by hierarchy level
  const groupedPositions = hierarchyLevels.map(level => ({
    ...level,
    positions: positions.filter(p => p.hierarchy_level === level.value),
  })).filter(group => group.positions.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            Leadership Positions
          </h3>
          <p className="text-sm text-dark-400 mt-1">
            Manage your society&apos;s leadership hierarchy
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Position
        </button>
      </div>

      {/* Positions List */}
      {positions.length === 0 ? (
        <div className="glass-light rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="h-8 w-8 text-dark-400" />
          </div>
          <p className="text-dark-300 text-lg">No leadership positions yet</p>
          <p className="text-dark-400 text-sm mt-1">Add your first position to build the hierarchy</p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-sm font-medium transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Position
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedPositions.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.value}>
                <h4 className="text-sm font-medium text-dark-300 mb-3 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {group.label}s
                </h4>
                <div className="space-y-2">
                  {group.positions.map((position) => (
                    <div
                      key={position.id}
                      className="glass-light rounded-xl p-4 flex items-center justify-between group hover:bg-dark-700/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full overflow-hidden ring-2 ring-offset-2 ring-offset-dark-900 bg-gradient-to-br ${levelColors[position.hierarchy_level]}`}>
                          {position.user?.avatar_url ? (
                            <Image
                              src={position.user.avatar_url}
                              alt={position.user.full_name || "Member"}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {/* Info */}
                        <div>
                          <p className="font-medium text-white">
                            {position.user?.full_name || <span className="text-dark-400 italic">Vacant</span>}
                          </p>
                          <p className="text-sm text-dark-400">
                            {position.custom_title || position.position_title}
                            {position.tenure_start && (
                              <span className="ml-2 text-dark-500">
                                • {format(new Date(position.tenure_start), "MMM yyyy")} - {position.tenure_end ? format(new Date(position.tenure_end), "MMM yyyy") : "Present"}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(position)}
                          className="p-2 text-dark-400 hover:text-white hover:bg-dark-600 rounded-lg transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {deleteConfirm === position.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(position.id)}
                              disabled={loading}
                              className="p-2 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="p-2 text-dark-400 hover:text-white hover:bg-dark-600 rounded-lg transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(position.id)}
                            className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />
          <div className="relative glass border border-dark-600 rounded-3xl w-full max-w-md animate-scale-in shadow-2xl shadow-accent-500/10 my-8 max-h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-dark-700/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-display font-semibold text-white">
                  {editingPosition ? "Edit Position" : "Add New Position"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-700 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-4 space-y-5">
              {error && (
                <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3 w-3 text-red-400" />
                  </div>
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Hierarchy Level */}
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-3">
                  Role Level <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {hierarchyLevels.map((level) => {
                    const Icon = level.icon;
                    const isSelected = formData.hierarchyLevel === level.value;
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, hierarchyLevel: level.value })}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          isSelected
                            ? `bg-gradient-to-r ${levelColors[level.value]} border-transparent text-white shadow-lg`
                            : "border-dark-600 bg-dark-800/50 text-dark-300 hover:border-dark-500 hover:text-white hover:bg-dark-800"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{level.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Title */}
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Custom Title <span className="text-dark-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                  placeholder={`e.g., Director of Marketing`}
                  className="w-full px-4 py-3 bg-dark-800/50 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Member Selection */}
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2">
                  Assign to Member
                </label>
                {loadingMembers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-accent-400" />
                  </div>
                ) : (
                  <select
                    value={formData.userId || ""}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value || null })}
                    className="w-full px-4 py-3 bg-dark-800/50 border border-dark-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Leave vacant</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name || "Unknown Member"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tenure */}
              <div>
                <label className="block text-sm font-medium text-dark-100 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent-400" />
                  Tenure
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-dark-400 mb-1.5">Start Date</label>
                    <input
                      type="month"
                      value={formData.tenureStart}
                      max={new Date().toISOString().substring(0, 7)}
                      onChange={(e) => setFormData({ ...formData, tenureStart: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-800/50 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-dark-400 mb-1.5">End Date</label>
                    {formData.isPresent ? (
                      <div className="px-3 py-2.5 bg-accent-500/10 border border-accent-500/30 rounded-xl text-accent-400 text-sm font-medium">
                        Present
                      </div>
                    ) : (
                      <input
                        type="month"
                        value={formData.tenureEnd}
                        max={new Date().toISOString().substring(0, 7)}
                        min={formData.tenureStart || undefined}
                        onChange={(e) => setFormData({ ...formData, tenureEnd: e.target.value })}
                        className="w-full px-3 py-2.5 bg-dark-800/50 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all"
                      />
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.isPresent}
                    onChange={(e) => setFormData({ ...formData, isPresent: e.target.checked, tenureEnd: "" })}
                    className="w-4 h-4 rounded border-dark-600 bg-dark-800/50 text-accent-500 focus:ring-accent-500 focus:ring-offset-0"
                  />
                  <span className="text-sm text-dark-300 group-hover:text-white transition-colors">Currently in this role</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-dark-700/50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 text-dark-300 hover:text-white bg-dark-800/50 hover:bg-dark-700 rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {editingPosition ? "Update" : "Add"} Position
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
