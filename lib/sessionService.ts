import { supabase } from "./supabaseClient";

export interface Session {
  id: string;
  name: string;
  code: string;
  password: string;
  creator_id: string;
  week_start: string;
  week_end: string;
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

export const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

export async function createSession(userId: string, name: string, password: string) {
  const code = generateCode();

  const start = new Date();
  const end = new Date();
  end.setDate(start.getDate() + 7);

  // 1. Create session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      name,
      code,
      password,
      creator_id: userId,
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

export async function joinSession(userId: string, code: string, password: string) {
  // 1. Find session by code
  const { data: session, error: findError } = await supabase
    .from("sessions")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (findError || !session) {
    throw new Error("Session not found.");
  }

  // 2. Check password
  if (session.password !== password) {
    throw new Error("Incorrect password.");
  }

  // 2. Add user to session_members
  const { error: memberError } = await supabase
    .from("session_members")
    .insert({
      session_id: session.id,
      user_id: userId,
    });

  if (memberError) {
    throw new Error("You already joined or cannot join this session.");
  }

  return session;
}