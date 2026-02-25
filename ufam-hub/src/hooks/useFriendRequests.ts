"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  responded_at?: string;
  user?: {
    id: string;
    nome: string;
    email: string;
    avatar_url: string;
  };
  isRequester: boolean;
}

export function useFriendRequests() {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = useCallback(async (type: "received" | "sent" | "all" = "received") => {
    try {
      setLoading(true);
      const response = await fetch(`/api/friends/requests?type=${type}`);
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        console.error("Erro ao carregar solicitações");
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendRequest = useCallback(async (userId: string) => {
    try {
      const response = await fetch("/api/friends/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "Solicitação de amizade enviada!");
        await loadRequests("sent");
        return { success: true, requiresApproval: data.requiresApproval };
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erro ao enviar solicitação");
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      toast.error("Erro ao enviar solicitação");
      return { success: false };
    }
  }, [loadRequests]);

  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (response.ok) {
        toast.success("Solicitação aceita!");
        await loadRequests();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erro ao aceitar solicitação");
        return false;
      }
    } catch (error) {
      console.error("Erro ao aceitar solicitação:", error);
      toast.error("Erro ao aceitar solicitação");
      return false;
    }
  }, [loadRequests]);

  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (response.ok) {
        toast.success("Solicitação rejeitada");
        await loadRequests();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erro ao rejeitar solicitação");
        return false;
      }
    } catch (error) {
      console.error("Erro ao rejeitar solicitação:", error);
      toast.error("Erro ao rejeitar solicitação");
      return false;
    }
  }, [loadRequests]);

  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/requests/${requestId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Solicitação cancelada");
        await loadRequests("sent");
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Erro ao cancelar solicitação");
        return false;
      }
    } catch (error) {
      console.error("Erro ao cancelar solicitação:", error);
      toast.error("Erro ao cancelar solicitação");
      return false;
    }
  }, [loadRequests]);

  const checkRequestStatus = useCallback(async (targetUserId: string): Promise<"none" | "pending_sent" | "pending_received" | "accepted"> => {
    try {
      const currentUserResponse = await fetch("/api/profile");
      if (!currentUserResponse.ok) {
        return "none";
      }
      const { profile: currentProfile } = await currentUserResponse.json();
      const currentUserId = currentProfile.id;

      const response = await fetch(`/api/friends/requests?type=all`);
      if (response.ok) {
        const data = await response.json();
        const allRequests = data.requests || [];
        
        const relevantRequest = allRequests.find(
          (req: FriendRequest) =>
            ((req.requester_id === currentUserId && req.receiver_id === targetUserId) ||
             (req.requester_id === targetUserId && req.receiver_id === currentUserId)) &&
            req.status === "pending"
        );

        if (relevantRequest) {
          if (relevantRequest.requester_id === currentUserId) {
            return "pending_sent";
          } else {
            return "pending_received";
          }
        }

        try {
          const followResponse = await fetch(`/api/users/follow?userId=${targetUserId}&type=followers`);
          if (followResponse.ok) {
            const followData = await followResponse.json();
            const isFollowing = followData.data?.some((f: any) => f.follower_id === currentUserId);
            if (isFollowing) {
              return "accepted";
            }
          }
        } catch {
        }

        return "none";
      }
      return "none";
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      return "none";
    }
  }, []);

  return {
    requests,
    loading,
    loadRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    checkRequestStatus,
  };
}
