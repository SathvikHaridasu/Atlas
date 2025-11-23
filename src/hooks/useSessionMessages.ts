import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url?: string | null;
  };
}

/**
 * Hook for managing session messages with live Realtime updates
 * 
 * NOTE: Realtime must be enabled on the `messages` table in Supabase dashboard
 * (Database → Replication → Realtime) for this to work.
 * 
 * @param sessionId - The session ID to fetch messages for
 * @returns Object containing messages array, setMessages function, loading state, and error
 */
export function useSessionMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isMounted = true;

    async function fetchMessages() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("messages")
          .select(`
            id,
            session_id,
            user_id,
            content,
            created_at,
            profiles (
              username,
              avatar_url
            )
          `)
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (!isMounted) return;

        if (fetchError) {
          console.error("[useSessionMessages] fetch error", fetchError);
          setError(fetchError.message);
          setMessages([]);
        } else {
          setMessages((data as Message[]) || []);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch messages";
        console.error("[useSessionMessages] unexpected error", err);
        setError(errorMessage);
        setMessages([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchMessages();

    // Realtime subscription for new messages
    // 
    // NOTE:
    // For this Realtime subscription to deliver INSERT events from other users:
    // 1) Realtime must be enabled for the `messages` table in Supabase dashboard
    //    (Database → Replication → Realtime).
    // 2) RLS policies on `messages` must allow the current user to SELECT rows
    //    for this `session_id`. If RLS blocks SELECT, Realtime will not send events.
    // 
    // Check console logs for "[Realtime] INSERT received" to confirm events are firing
    console.log("[Realtime] subscribing to messages for session:", sessionId);
    
    const channel = supabase
      .channel(`messages:session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`, // must match DB column exactly
        },
        (payload) => {
          console.log("[Realtime] INSERT received", payload);

          if (!isMounted) {
            console.log("[Realtime] Component unmounted, ignoring event");
            return;
          }

          const newMessage = payload.new;

          if (!newMessage) {
            console.warn("[Realtime] payload.new is missing");
            return;
          }

          // Directly use payload.new to add message to state
          // Deduplication ensures optimistic inserts don't cause duplicates
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) {
              // Already have it (e.g., optimistic insert or duplicate event)
              console.log("[Realtime] Message already exists, skipping duplicate", newMessage.id);
              return prev;
            }
            console.log("[Realtime] Adding new message to state", {
              id: newMessage.id,
              userId: newMessage.user_id,
              content: newMessage.content,
            });
            return [...prev, newMessage as Message];
          });
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
        
        if (status === "SUBSCRIBED") {
          console.log("[Realtime] ✓ Successfully subscribed to messages for session", sessionId);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[Realtime] ✗ Subscription error:", status);
          if (isMounted) {
            setError("Failed to connect to live updates");
          }
        }
      });

    return () => {
      console.log("[Realtime] Cleaning up subscription for session:", sessionId);
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { messages, setMessages, loading, error };
}

