import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp 
} from "firebase/firestore";

// ─── LEAGUES ─────────────────────────────────────────────────────────────

export async function createLeague(userId, leagueName) {
  const code = generateLeagueCode();
  const leagueId = `league_${Date.now()}`;
  
  await setDoc(doc(db, "leagues", leagueId), {
    name: leagueName,
    code,
    createdBy: userId,
    members: [userId],
    season: "Spring 2026",
    createdAt: serverTimestamp(),
  });
  
  return { id: leagueId, name: leagueName, code, members: [userId] };
}

export async function joinLeague(userId, leagueCode) {
  const leaguesRef = collection(db, "leagues");
  const q = query(leaguesRef, where("code", "==", leagueCode.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) throw new Error("League not found");
  
  const leagueDoc = snapshot.docs[0];
  await updateDoc(leagueDoc.ref, {
    members: arrayUnion(userId),
  });
  
  return { id: leagueDoc.id, ...leagueDoc.data() };
}

export async function getUserLeagues(userId) {
  const leaguesRef = collection(db, "leagues");
  const q = query(leaguesRef, where("members", "array-contains", userId));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ─── PICKS ───────────────────────────────────────────────────────────────

export async function saveWeeklyPicks(userId, leagueId, week, picks) {
  const pickId = `${leagueId}_${userId}_${week}`;
  
  await setDoc(doc(db, "picks", pickId), {
    userId,
    leagueId,
    week,
    picks, // { gameId: teamId, ... }
    submittedAt: serverTimestamp(),
  });
}

export async function getWeeklyPicks(userId, leagueId, week) {
  const pickId = `${leagueId}_${userId}_${week}`;
  const docSnap = await getDoc(doc(db, "picks", pickId));
  
  return docSnap.exists() ? docSnap.data().picks : {};
}

// ─── BRACKET PICKS ───────────────────────────────────────────────────────

export async function saveBracketPicks(userId, leagueId, picks) {
  const bracketId = `${leagueId}_${userId}`;
  
  await setDoc(doc(db, "bracketPicks", bracketId), {
    userId,
    leagueId,
    picks, // { matchupId: teamId, ... }
    submittedAt: serverTimestamp(),
  });
}

export async function getBracketPicks(userId, leagueId) {
  const bracketId = `${leagueId}_${userId}`;
  const docSnap = await getDoc(doc(db, "bracketPicks", bracketId));
  
  return docSnap.exists() ? docSnap.data().picks : {};
}

// ─── CHAMPION PICK ───────────────────────────────────────────────────────

export async function saveChampionPick(userId, teamId) {
  await updateDoc(doc(db, "users", userId), {
    championPick: teamId,
    championLocked: true,
  });
}

export async function getChampionPick(userId) {
  const docSnap = await getDoc(doc(db, "users", userId));
  
  if (!docSnap.exists()) return { championPick: null, championLocked: false };
  
  const data = docSnap.data();
  return {
    championPick: data.championPick || null,
    championLocked: data.championLocked || false,
  };
}

// ─── USER PROFILE ────────────────────────────────────────────────────────

export async function createUserProfile(userId, email, name) {
  await setDoc(doc(db, "users", userId), {
    email,
    name: name || email.split("@")[0],
    championPick: null,
    championLocked: false,
    createdAt: serverTimestamp(),
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────

function generateLeagueCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}