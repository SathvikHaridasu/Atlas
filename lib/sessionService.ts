import { supabase } from "./supabaseClient";

export interface Session {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  status: string; // 'active', 'completed', etc.
  code: string | null; // Database column is 'code' (NOT NULL)
  join_code?: string | null; // Alias for compatibility
  week_start?: string;
  week_end?: string;
}

export interface SessionMember {
  id: string;
  session_id: string;
  user_id: string;
  points: number;
  dare_text?: string | null;
  dare_submitted?: boolean;
}

export interface SessionDare {
  id: string;
  session_id: string;
  user_id: string;
  dare_text: string;
}

export interface SessionWeekResult {
  id: string;
  session_id: string;
  loser_user_id: string;
  chosen_dare_id: string;
}

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
 * Generate a random 6-character alphanumeric join code
 * @returns Random 6-character alphanumeric code
 */
export function generateJoinCode(): string {
  const length = 6; // ALWAYS 6
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Create a new session with auto-generated join code
 * Gets the authenticated user from Supabase auth and creates a session
 * @param name - The session name
 * @returns The created session
 */
export async function createSession(name: string): Promise<Session> {
  // 1. Get the current authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated. Please sign in to create a session.");
  }

  // 2. Generate a random 6-character join code
  const joinCode = generateJoinCode();

  // Optional: Set week start/end dates (7 days from now)
  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 7);

  try {
    // 3. Create session with created_by matching auth.uid()
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert([
        {
          name: name.trim(),
          created_by: user.id, // Must match auth.uid() for RLS policy
          code: joinCode, // Database column is 'code' (NOT NULL constraint)
          // status omitted -> DB default 'active'
          week_start: start.toISOString().split("T")[0],
          week_end: end.toISOString().split("T")[0],
        },
      ])
      .select()
      .single();

    if (sessionError) {
      // Log detailed error for debugging
      console.error("Session creation error:", {
        code: sessionError.code,
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint,
      });

      // Handle specific errors
      if (sessionError.code === "42501") {
        throw new Error(
          "Row-level security policy violation. Make sure you're authenticated and the RLS policies are correctly configured."
        );
      }

      if (sessionError.code === "23502") {
        throw new Error(
          "Database constraint violation: The 'code' column cannot be null. Please ensure the session code is generated correctly."
        );
      }

      if (sessionError.code === "PGRST204") {
        throw new Error(
          "Database schema error: Missing required columns. Please run the migration to add status, created_by, and code columns to the sessions table."
        );
      }

      // Generic error message
      throw new Error(
        sessionError.message || "Failed to create session. Please try again."
      );
    }

    if (!session) {
      throw new Error("Failed to create session: No data returned.");
    }

    // 4. Add user to session_members
    const { error: memberError } = await supabase.from("session_members").insert({
      session_id: session.id,
      user_id: user.id,
      points: 0, // Initialize points for the creator
    });

    if (memberError) {
      console.error("Failed to add user to session:", memberError);
      // Don't throw here - the session was created successfully
      // User can manually join if needed
      console.warn("Session created but user not automatically added as member.");
    }

    return session;
  } catch (error) {
    // Re-throw if it's already an Error with a message
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap in Error
    throw new Error(
      `Unexpected error creating session: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function submitDare(userId: string, sessionId: string, dareText: string) {
  // Ensure user is a member
  const { data: member } = await supabase
    .from("session_members")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .single();

  if (!member) {
    // Auto-add to members if not already
    await supabase
      .from("session_members")
      .insert({
        session_id: sessionId,
        user_id: userId,
      });
  }

  const { error } = await supabase
    .from("session_dares")
    .insert({
      session_id: sessionId,
      user_id: userId,
      dare_text: dareText,
    });

  if (error) {
    console.error(error);
    throw new Error("Failed to submit dare.");
  }
}

export async function getSession(sessionId: string): Promise<Session> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    throw new Error("Session not found.");
  }

  return data;
}

export async function getSessionMembers(sessionId: string): Promise<SessionMember[]> {
  const { data, error } = await supabase
    .from("session_members")
    .select("*")
    .eq("session_id", sessionId);

  if (error) {
    console.error(error);
    throw new Error("Failed to get session members.");
  }

  return data || [];
}

/**
 * Get a specific user's membership for a session
 * @param sessionId - The session ID
 * @param userId - The user ID
 * @returns The membership record or null if not found
 */
export async function getSessionMembership(
  sessionId: string,
  userId: string
): Promise<SessionMember | null> {
  const { data, error } = await supabase
    .from("session_members")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function getSessionDares(sessionId: string): Promise<SessionDare[]> {
  const { data, error } = await supabase
    .from("session_dares")
    .select("*")
    .eq("session_id", sessionId);

  if (error) {
    console.error(error);
    throw new Error("Failed to get session dares.");
  }

  return data || [];
}

export async function incrementPoints(userId: string, sessionId: string, value: number = 1) {
  // First get current points
  const { data: member, error: fetchError } = await supabase
    .from("session_members")
    .select("points")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .single();

  if (fetchError || !member) {
    throw new Error("Member not found.");
  }

  // Then update
  const { error } = await supabase
    .from("session_members")
    .update({ points: member.points + value })
    .eq("user_id", userId)
    .eq("session_id", sessionId);

  if (error) {
    console.error(error);
    throw new Error("Failed to increment points.");
  }
}

export function listenToMembers(sessionId: string, callback: (members: SessionMember[]) => void) {
  const channel = supabase
    .channel(`session_members_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "session_members",
        filter: `session_id=eq.${sessionId}`,
      },
      async () => {
        const members = await getSessionMembers(sessionId);
        callback(members);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function endOfWeekProcessing(sessionId: string) {
  // 1. Get members
  const members = await getSessionMembers(sessionId);
  if (members.length === 0) return;

  // 2. Find lowest score
  const loser = members.reduce((prev, curr) => (prev.points < curr.points ? prev : curr));

  // 3. Get dares
  const dares = await getSessionDares(sessionId);
  if (dares.length === 0) return;

  // 4. Randomly choose a dare
  const randomDare = dares[Math.floor(Math.random() * dares.length)];

  // 5. Store result
  const { error: resultError } = await supabase
    .from("session_week_results")
    .insert({
      session_id: sessionId,
      loser_user_id: loser.user_id,
      chosen_dare_id: randomDare.id,
    });

  if (resultError) {
    console.error(resultError);
    throw new Error("Failed to store week result.");
  }

  // 6. Reset points
  const { error: resetError } = await supabase
    .from("session_members")
    .update({ points: 0 })
    .eq("session_id", sessionId);

  if (resetError) {
    console.error(resetError);
    throw new Error("Failed to reset points.");
  }

  // 7. Clear dares
  const { error: clearError } = await supabase
    .from("session_dares")
    .delete()
    .eq("session_id", sessionId);

  if (clearError) {
    console.error(clearError);
    throw new Error("Failed to clear dares.");
  }

  // 8. Set next week
  const now = new Date();
  const nextStart = new Date(now);
  nextStart.setDate(now.getDate() + 1);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 6);

  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      week_start: nextStart.toISOString().split("T")[0],
      week_end: nextEnd.toISOString().split("T")[0],
    })
    .eq("id", sessionId);

  if (updateError) {
    console.error(updateError);
    throw new Error("Failed to update week dates.");
  }
}

export async function sendMessage(
  sessionId: string,
  userId: string,
  content: string
): Promise<Message> {
  // Ensure user is a member
  const { data: member } = await supabase
    .from("session_members")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .single();

  if (!member) {
    // Auto-add to members if not already
    await supabase
      .from("session_members")
      .insert({
        session_id: sessionId,
        user_id: userId,
      });
  }

  // Validate that content is provided
  if (!content || !content.trim()) {
    throw new Error("Message must have content");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      user_id: userId,
      content: content.trim(),
    })
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
    .single();

  if (error) {
    console.error(error);
    throw new Error("Failed to send message.");
  }

  if (!data) {
    throw new Error("Failed to send message: No data returned.");
  }

  return data as Message;
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
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

  if (error) {
    console.error(error);
    throw new Error("Failed to get messages.");
  }

  return data || [];
}

export function listenToMessages(sessionId: string, setMessages: (messages: Message[]) => void) {
  // Initial load
  getMessages(sessionId)
    .then(setMessages)
    .catch((error) => {
      console.error('Error loading initial messages:', error);
      setMessages([]);
    });

  // Create channel with unique name per session
  const channelName = `messages:${sessionId}`;
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
        const { data: newMessage, error } = await supabase
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

        if (!error && newMessage) {
          // Add new message to existing messages
          setMessages((prevMessages) => {
            // Check if message already exists to avoid duplicates
            if (prevMessages.some((msg) => msg.id === newMessage.id)) {
              return prevMessages;
            }
            return [...prevMessages, newMessage];
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to messages for session ${sessionId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to messages for session ${sessionId}`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Join a session using a 6-character join code
 * @param userId - The authenticated user's ID
 * @param joinCode - The 6-character join code (should be normalized: uppercase, trimmed)
 * @returns The session that was joined
 */
export async function joinSessionWithCode(userId: string, joinCode: string): Promise<Session> {
  // ===== ROOT CAUSE DIAGNOSIS =====
  // Primary issue: RLS policy may block non-members from SELECTing sessions
  // Secondary issue: Possible column name mismatch (code vs join_code)
  // =================================

  // [JOIN] Log raw input code for debugging
  console.log("[JOIN] Raw code from input:", joinCode);
  
  // Normalize the code (should already be normalized, but ensure it)
  const normalizedCode = joinCode.trim().toUpperCase();
  console.log("[JOIN] Normalized code:", normalizedCode);
  
  if (normalizedCode.length !== 6) {
    throw new Error("Join code must be exactly 6 characters");
  }

  // 1. Find session by code
  // ROOT CAUSE: Database column might be 'code' or 'join_code'
  // Try 'code' first (most recent schema), then 'join_code' as fallback
  console.log("[JOIN] Looking up session with normalized code:", normalizedCode);
  
  // First try 'code' column (current expected schema)
  let { data: session, error: findError } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle();

  console.log("[JOIN] Query result using 'code' column:", {
    found: !!session,
    error: findError?.code,
    errorMessage: findError?.message,
  });

  // If not found with 'code', try 'join_code' column (older schema or alternate column name)
  if (!session && !findError) {
    console.log("[JOIN] Session not found with 'code' column, trying 'join_code' column...");
    const { data: sessionByJoinCode, error: joinCodeError } = await supabase
      .from("sessions")
      .select("*")
      .eq("join_code", normalizedCode)
      .maybeSingle();
    
    console.log("[JOIN] Query result using 'join_code' column:", {
      found: !!sessionByJoinCode,
      error: joinCodeError?.code,
      errorMessage: joinCodeError?.message,
    });
    
    if (sessionByJoinCode) {
      session = sessionByJoinCode;
      console.log("[JOIN] ✓ Found session using 'join_code' column");
    } else if (joinCodeError) {
      findError = joinCodeError;
      console.log("[JOIN] ✗ Error with 'join_code' column query");
    }
  } else if (session) {
    console.log("[JOIN] ✓ Found session using 'code' column");
  }

  // [JOIN] Log the Supabase query result
  console.log("[JOIN] Supabase session query result:", {
    session: session ? { id: session.id, name: session.name, code: session.code, status: session.status } : null,
    error: findError ? {
      code: findError.code,
      message: findError.message,
      details: findError.details,
      hint: findError.hint,
    } : null,
  });

  if (findError) {
    console.error('[JOIN] Error looking up session by code:', findError);
    // Handle specific RLS errors
    if (findError.code === '42501') {
      throw new Error(
        "Unable to look up session. The database policy may need to allow looking up sessions by join code for non-members. Please check the RLS policies."
      );
    }
    throw new Error(`Failed to look up session: ${findError.message}`);
  }

  // [JOIN] Session not found - this happens when RLS blocks the query or code doesn't exist
  if (!session) {
    console.log("[JOIN] Session not found. Possible causes:");
    console.log("  1. RLS policy blocking SELECT for non-members");
    console.log("  2. Join code doesn't exist in database");
    console.log("  3. Column name mismatch (code vs join_code)");
    console.log("  4. Code casing mismatch (stored differently than queried)");
    throw new Error("Session not found. Please check the join code and try again.");
  }

  // Check if session is active
  if (session.status !== 'active') {
    throw new Error("This session is no longer active.");
  }

  // 2. Upsert membership (insert if not exists, update if exists)
  // Use upsert to handle race conditions and re-joining gracefully
  const { error: memberError } = await supabase
    .from("session_members")
    .upsert(
      {
        session_id: session.id,
        user_id: userId,
        points: 0, // Initialize/reset points when joining
      },
      {
        onConflict: 'session_id,user_id',
        ignoreDuplicates: false, // Update if exists (reset points)
      }
    );

  if (memberError) {
    console.error('Join session membership error:', memberError);
    // Handle specific RLS errors
    if (memberError.code === '42501') {
      throw new Error(
        "Unable to join session. Please ensure you're authenticated and the session_members RLS policy allows joining."
      );
    }
    // If it's a duplicate key error, that's fine - user is already a member
    if (memberError.code === '23505' || memberError.message?.includes('duplicate')) {
      // User is already a member, which is okay - return the session
      console.log('User is already a member of this session');
      return session;
    }
    throw new Error(`Failed to join session: ${memberError.message}`);
  }

  // Successfully joined the session
  return session;
}

export interface SessionWithProfile extends Session {
  profiles?: {
    id: string;
    avatar_url?: string;
    username?: string;
  };
}

export async function getUserSessions(userId: string): Promise<SessionWithProfile[]> {
  // Get session IDs where user is a member
  const { data: memberData, error: memberError } = await supabase
    .from("session_members")
    .select("session_id")
    .eq("user_id", userId);

  if (memberError) {
    console.error(memberError);
    throw new Error("Failed to get user sessions.");
  }

  if (!memberData || memberData.length === 0) {
    return [];
  }

  const sessionIds = memberData.map(m => m.session_id);

  // Get sessions with creator profiles
  // Note: profiles.id is the primary key (references auth.users.id)
  // sessions.created_by references profiles.id
  const { data, error } = await supabase
    .from("sessions")
    .select(`
      *,
      profiles:created_by (
        id,
        avatar_url,
        username
      )
    `)
    .in("id", sessionIds);

  if (error) {
    console.error(error);
    throw new Error("Failed to get sessions.");
  }

  return data || [];
}

/**
 * Leave a session by removing the user from session_members
 * @param sessionId - The session ID to leave
 * @param userId - The authenticated user's ID
 */
export async function leaveSession(sessionId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from("session_members")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", userId);

  if (error) {
    console.error('[LEAVE SESSION] error', error);
    // Handle specific RLS errors
    if (error.code === '42501') {
      throw new Error(
        "Unable to leave session. Please ensure you're authenticated and have permission to leave."
      );
    }
    throw new Error(`Failed to leave session: ${error.message}`);
  }
}