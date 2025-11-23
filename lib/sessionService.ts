import { supabase } from "./supabaseClient";

export interface Session {
  id: string;
  name: string;
  status: string;
  created_by: string;
  join_code: string;
  week_start?: string;
  week_end?: string;
}

export interface SessionMember {
  id: string;
  session_id: string;
  user_id: string;
  points: number;
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
  content: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

export const generateJoinCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export async function createSession(userId: string, name: string) {
  const joinCode = generateJoinCode();

  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 7);

  // 1. Create session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      name,
      join_code: joinCode,
      status: 'active',
      created_by: userId,
      week_start: start.toISOString().split("T")[0],
      week_end: end.toISOString().split("T")[0],
    })
    .select()
    .single();

  if (sessionError) {
    console.error(sessionError);
    throw new Error("Failed to create session.");
  }

  // 2. Add user to session_members
  const { error: memberError } = await supabase
    .from("session_members")
    .insert({
      session_id: session.id,
      user_id: userId,
    });

  if (memberError) {
    console.error(memberError);
    throw new Error("Failed to add user to session.");
  }

  return session;
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

export async function sendMessage(sessionId: string, userId: string, content: string) {
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
    .from("messages")
    .insert({
      session_id: sessionId,
      user_id: userId,
      content,
    });

  if (error) {
    console.error(error);
    throw new Error("Failed to send message.");
  }
}

export async function getMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      profiles (
        username
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
  getMessages(sessionId).then(setMessages).catch(console.error);

  const channel = supabase
    .channel(`messages_${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `session_id=eq.${sessionId}`,
      },
      async (payload) => {
        // Get updated messages list
        const messages = await getMessages(sessionId);
        setMessages(messages);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function joinSessionWithCode(userId: string, joinCode: string) {
  // 1. Find session by join_code
  const { data: session, error: findError } = await supabase
    .from("sessions")
    .select("*")
    .eq("join_code", joinCode.toUpperCase())
    .single();

  if (findError || !session) {
    throw new Error("Session not found.");
  }

  // 2. Add user to session_members (if not already a member)
  const { error: memberError } = await supabase
    .from("session_members")
    .insert({
      session_id: session.id,
      user_id: userId,
    });

  if (memberError) {
    // Check if it's a duplicate key error (user already joined)
    if (memberError.code === '23505') {
      throw new Error("You have already joined this session.");
    }
    throw new Error("Failed to join session.");
  }

  return session;
}

export async function getUserSessions(userId: string): Promise<Session[]> {
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

  // Get sessions
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .in("id", sessionIds);

  if (error) {
    console.error(error);
    throw new Error("Failed to get sessions.");
  }

  return data || [];
}