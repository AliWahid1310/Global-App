"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveSociety, rejectSociety } from "./actions";
import { Check, X, Loader2 } from "lucide-react";

interface ApprovalActionsProps {
  societyId: string;
  societyName: string;
}

export function ApprovalActions({ societyId, societyName }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    setError(null);

    try {
      const result = action === "approve" 
        ? await approveSociety(societyId)
        : await rejectSociety(societyId);

      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} society`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
      >
        {loading === "approve" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Approve
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 text-sm font-medium rounded-xl hover:bg-red-500/30 transition-colors disabled:opacity-50 border border-red-500/30"
      >
        {loading === "reject" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <X className="w-4 h-4" />
        )}
        Reject
      </button>
      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  );
}
