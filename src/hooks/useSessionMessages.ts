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
    // IMPORTANT: Realtime must be enabled on the `messages` table in Supabase dashboard:
    // 1. Go to Supabase Dashboard → Database → Replication
    // 2. Find the `messages` table in the list
    // 3. Toggle "Enable Realtime" to ON (should show a checkmark)
    // 4. Verify RLS policies allow SELECT for messages in sessions the user belongs to:
    //    - Go to Database → Policies → messages table
    //    - Ensure there's a policy allowing SELECT for users in the same session
    //    - The policy should check: auth.uid() IN (SELECT user_id FROM session_members WHERE session_id = messages.session_id)
    //
    // If messages from other users don't appear:
    // - Check browser console/React Native logs for "[Realtime] INSERT event received" messages
    // - If you don't see those logs, the subscription isn't receiving events (check Realtime is enabled)
    // - If you see the logs but messages don't appear, check RLS policies
    const channelName = `messages:session:${sessionId}`;
    console.log("[useSessionMessages] Setting up Realtime subscription for channel:", channelName);
    
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
          console.log("[Realtime] INSERT event received for messages table", {
            sessionId,
            messageId: payload.new.id,
            userId: payload.new.user_id,
            payload: payload.new,
          });

          if (!isMounted) {
            console.log("[Realtime] Component unmounted, ignoring event");
            return;
          }

          try {
            // Try to fetch the full message with profile data
            // This might fail if RLS doesn't allow reading yet, so we have a fallback
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
              console.log("[Realtime] Successfully fetched new message with profile", newMessage);
              const message = newMessage as Message;
              // Avoid duplicates by checking if message already exists
              setMessages((prev) => {
                if (prev.find((m) => m.id === message.id)) {
                  console.log("[Realtime] Message already exists in state, skipping", message.id);
                  return prev;
                }
                console.log("[Realtime] Adding new message to state", message.id);
                return [...prev, message];
              });
            } else {
              console.warn("[Realtime] Failed to fetch full message with profile, using payload data", {
                error: fetchError,
                payload: payload.new,
              });
              
              // Fallback: Use payload.new directly if fetch fails (e.g., due to RLS)
              // This ensures messages still appear even if profile fetch fails
              const fallbackMessage: Message = {
                id: payload.new.id as string,
                session_id: payload.new.session_id as string,
                user_id: payload.new.user_id as string,
                content: payload.new.content as string | null,
                created_at: payload.new.created_at as string,
                profiles: undefined, // Will be undefined if fetch fails
              };

              if (!isMounted) return;

              setMessages((prev) => {
                if (prev.find((m) => m.id === fallbackMessage.id)) {
                  console.log("[Realtime] Fallback message already exists, skipping", fallbackMessage.id);
                  return prev;
                }
                console.log("[Realtime] Adding fallback message (without profile) to state", fallbackMessage.id);
                return [...prev, fallbackMessage];
              });
            }
          } catch (err) {
            console.error("[Realtime] Unexpected error processing INSERT event", err);
            // Still try to add message from payload as fallback
            if (!isMounted) return;
            const fallbackMessage: Message = {
              id: payload.new.id as string,
              session_id: payload.new.session_id as string,
              user_id: payload.new.user_id as string,
              content: payload.new.content as string | null,
              created_at: payload.new.created_at as string,
              profiles: undefined,
            };
            setMessages((prev) => {
              if (prev.find((m) => m.id === fallbackMessage.id)) {
                return prev;
              }
              return [...prev, fallbackMessage];
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("[useSessionMessages] Subscription status changed", {
          channelName,
          sessionId,
          status,
        });
        
        if (status === "SUBSCRIBED") {
          console.log("[useSessionMessages] ✓ Successfully subscribed to messages for session", sessionId);
        } else if (status === "CHANNEL_ERROR") {
          console.error("[useSessionMessages] ✗ Channel error - Realtime subscription failed", {
            channelName,
            sessionId,
          });
          if (isMounted) {
            setError("Failed to connect to live updates");
          }
        } else if (status === "TIMED_OUT") {
          console.error("[useSessionMessages] ✗ Subscription timed out", {
            channelName,
            sessionId,
          });
          if (isMounted) {
            setError("Live updates connection timed out");
          }
        } else if (status === "CLOSED") {
          console.log("[useSessionMessages] Subscription closed", {
            channelName,
            sessionId,
          });
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { messages, setMessages, loading, error };
}

