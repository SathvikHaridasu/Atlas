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
    const channelName = `messages:session:${sessionId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          // Fetch the full message with profile data
          const { data: newMessage, error: fetchError } = await supabase
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
            .eq("id", payload.new.id)
            .single();

          if (!isMounted) return;

          if (!fetchError && newMessage) {
            const message = newMessage as Message;
            // Avoid duplicates by checking if message already exists
            setMessages((prev) => {
              if (prev.find((m) => m.id === message.id)) {
                return prev;
              }
              return [...prev, message];
            });
          } else if (fetchError) {
            console.error("[useSessionMessages] error fetching new message", fetchError);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[useSessionMessages] subscribed to messages for session", sessionId);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[useSessionMessages] subscription error for session", sessionId, status);
          if (isMounted) {
            setError("Failed to connect to live updates");
          }
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { messages, setMessages, loading, error };
}

