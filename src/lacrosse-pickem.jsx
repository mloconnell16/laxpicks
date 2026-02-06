import { useState, useEffect } from "react";
import { createLeague, joinLeague, getUserLeagues, saveWeeklyPicks, getWeeklyPicks, createUserProfile } from "./firestore";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const TEAMS = [
  { id: 1, name: "Cornell",        seed: 1,  abbr: "COR",  color: "#B7410E", conf: "Ivy",    record: "14-2" },
  { id: 2, name: "Maryland",       seed: 2,  abbr: "UMD",  color: "#E21836", conf: "Big Ten", record: "13-3" },
  { id: 3, name: "Princeton",      seed: 3,  abbr: "PRIN", color: "#F58733", conf: "Ivy",    record: "13-3" },
  { id: 4, name: "Ohio State",     seed: 4,  abbr: "OSU",  color: "#BB0000", conf: "Big Ten", record: "12-4" },
  { id: 5, name: "Penn State",     seed: 5,  abbr: "PSU",  color: "#003087", conf: "Big Ten", record: "12-4" },
  { id: 6, name: "Syracuse",       seed: 6,  abbr: "SYR",  color: "#F76F1B", conf: "ACC",    record: "11-5" },
  { id: 7, name: "Duke",           seed: 7,  abbr: "DUKE", color: "#00245D", conf: "ACC",    record: "11-5" },
  { id: 8, name: "North Carolina", seed: 8,  abbr: "UNC",  color: "#75B2DD", conf: "ACC",    record: "10-6" },
  { id: 9, name: "Notre Dame",     seed: null, abbr: "ND",   color: "#1B539E", conf: "Big Ten", record: "9-7" },
  { id: 10, name: "Georgetown",    seed: null, abbr: "GTW",  color: "#041E3C", conf: "Big East", record: "9-7" },
  { id: 11, name: "Richmond",      seed: null, abbr: "RIC",  color: "#9C1A22", conf: "Colonial", record: "9-7" },
  { id: 12, name: "Towson",        seed: null, abbr: "TOW",  color: "#FDB827", conf: "Colonial", record: "8-8" },
  { id: 13, name: "Harvard",       seed: null, abbr: "HRV",  color: "#9B111E", conf: "Ivy",    record: "8-8" },
  { id: 14, name: "Air Force",     seed: null, abbr: "AFA",  color: "#0F3864", conf: "Patriot", record: "8-8" },
  { id: 15, name: "UAlbany",       seed: null, abbr: "UABL", color: "#2A509E", conf: "America East", record: "8-8" },
  { id: 16, name: "Colgate",       seed: null, abbr: "CLG",  color: "#BF0A30", conf: "Patriot", record: "7-9" },
  { id: 17, name: "Loyola Maryland", seed: null, abbr: "LOY", color: "#003366", conf: "Colonial", record: "7-9" },
  { id: 18, name: "High Point",    seed: null, abbr: "HPU",  color: "#002147", conf: "Southern", record: "7-9" },
];

const getTeam = (id) => TEAMS.find((t) => t.id === id);

// Top contenders shown on champion pick screen (seeded teams + a couple mid-majors with buzz)
const CHAMPION_CANDIDATES = [1, 2, 3, 4, 5, 6, 7, 8];

const WEEKLY_SLATE = [
  { id: 1, home: 1, away: 9,  spread: -4.5, week: 8, status: "upcoming", time: "Sat 1:00 PM" },
  { id: 2, home: 3, away: 10, spread: -3.0, week: 8, status: "upcoming", time: "Sat 2:30 PM" },
  { id: 3, home: 5, away: 12, spread: -5.5, week: 8, status: "upcoming", time: "Sat 4:00 PM" },
  { id: 4, home: 6, away: 13, spread: -2.5, week: 8, status: "upcoming", time: "Sat 5:30 PM" },
  { id: 5, home: 2, away: 14, spread: -7.0, week: 8, status: "upcoming", time: "Sun 1:00 PM" },
  { id: 6, home: 4, away: 11, spread: -1.5, week: 8, status: "upcoming", time: "Sun 2:30 PM" },
  { id: 7, home: 7, away: 15, spread: -3.5, week: 8, status: "upcoming", time: "Sun 4:00 PM" },
  { id: 8, home: 8, away: 16, spread: -2.0, week: 8, status: "upcoming", time: "Sun 5:30 PM" },
];

const MOCK_LEAGUE_MEMBERS = [
  { id: "user1", name: "Liam",   avatar: "LM", totalPoints: 284, championPick: 1, weeklyPoints: [38,42,30,45,38,41,50] },
  { id: "user2", name: "Jake",   avatar: "JK", totalPoints: 271, championPick: 3, weeklyPoints: [40,35,42,38,44,36,36] },
  { id: "user3", name: "Connor", avatar: "CN", totalPoints: 258, championPick: 6, weeklyPoints: [35,38,40,30,42,40,33] },
  { id: "user4", name: "Matt",   avatar: "MT", totalPoints: 247, championPick: 2, weeklyPoints: [30,40,35,35,38,35,34] },
  { id: "user5", name: "Danny",  avatar: "DN", totalPoints: 239, championPick: 5, weeklyPoints: [42,30,28,40,35,32,32] },
  { id: "user6", name: "You",    avatar: "YO", totalPoints: 262, championPick: 1, weeklyPoints: [36,40,38,42,36,38,32] },
];

const MOCK_LEAGUES = [
  { id: "league1", name: "The Faceoff",  code: "FOFF", members: MOCK_LEAGUE_MEMBERS,          createdBy: "user1", season: "Spring 2026" },
  { id: "league2", name: "Crease Kings", code: "CRSK", members: MOCK_LEAGUE_MEMBERS.slice(0,4), createdBy: "user2", season: "Spring 2026" },
];

const BROWSE_LEAGUES = [
  { id: "league3", name: "Hopkins Crew",      code: "HOPS", memberCount: 12, season: "Spring 2026" },
  { id: "league4", name: "Ground Ball Gang",  code: "GBBG", memberCount: 8,  season: "Spring 2026" },
  { id: "league5", name: "Attack Dogs",       code: "ATCK", memberCount: 6,  season: "Spring 2026" },
  { id: "league6", name: "Midfield Madness",  code: "MFLD", memberCount: 15, season: "Spring 2026" },
];

const BRACKET_DATA = {
  opening: [
    { id: "o1", top: 9,  bottom: 10, winner: null },
    { id: "o2", top: 11, bottom: 12, winner: null },
  ],
  firstRound: [
    { id: "r1", top: 1,    bottom: "o1", winner: null },
    { id: "r2", top: 3,    bottom: 16,   winner: null },
    { id: "r3", top: 5,    bottom: "o2", winner: null },
    { id: "r4", top: 4,    bottom: 17,   winner: null },
    { id: "r5", top: 2,    bottom: 14,   winner: null },
    { id: "r6", top: 6,    bottom: 13,   winner: null },
    { id: "r7", top: 7,    bottom: 15,   winner: null },
    { id: "r8", top: 8,    bottom: 18,   winner: null },
  ],
  quarterfinals: [
    { id: "q1", top: "r1", bottom: "r2", winner: null },
    { id: "q2", top: "r3", bottom: "r4", winner: null },
    { id: "q3", top: "r5", bottom: "r6", winner: null },
    { id: "q4", top: "r7", bottom: "r8", winner: null },
  ],
  semifinals: [
    { id: "s1", top: "q1", bottom: "q2", winner: null },
    { id: "s2", top: "q3", bottom: "q4", winner: null },
  ],
  final: { id: "f1", top: "s1", bottom: "s2", winner: null },
};

const CHAMPION_BONUS = 500;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500;600&display=swap');

  :root {
    --bg-deep: #0a0e14;
    --bg-card: #111820;
    --bg-card-hover: #161e2a;
    --bg-input: #0d1117;
    --green: #39ff5a;
    --green-dim: rgba(57,255,90,0.12);
    --green-glow: rgba(57,255,90,0.25);
    --text-primary: #f0f2f5;
    --text-secondary: #7a8694;
    --text-muted: #4a5568;
    --border: rgba(255,255,255,0.06);
    --border-hover: rgba(57,255,90,0.25);
    --red: #ff4d4d;
    --gold: #f5c842;
    --gold-dim: rgba(245,200,66,0.12);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Barlow', sans-serif;
    background: var(--bg-deep);
    color: var(--text-primary);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    overscroll-behavior-y: contain;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }

  /* ── AUTH ── */
  .auth-wrap {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-deep);
    position: relative; overflow: hidden;
    padding: 24px;
  }
  .auth-wrap::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 30%, rgba(57,255,90,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .auth-card {
    position: relative; z-index: 1;
    width: 100%; max-width: 400px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px 32px;
  }
  .auth-logo { text-align: center; margin-bottom: 32px; }
  .auth-logo h1 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 42px;
    letter-spacing: -1px; color: var(--text-primary); line-height: 1;
  }
  .auth-logo h1 span { color: var(--green); }
  .auth-logo p { color: var(--text-muted); font-size: 13px; margin-top: 6px; letter-spacing: 0.4px; }
  .auth-card h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 22px;
    margin-bottom: 20px; text-align: center; color: var(--text-primary);
  }
  .form-group { margin-bottom: 14px; }
  .form-group label {
    display: block; font-size: 12px; font-weight: 600;
    color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.8px; margin-bottom: 6px;
  }
  .form-group input {
    width: 100%; padding: 12px 14px;
    background: var(--bg-input); border: 1px solid var(--border);
    border-radius: 10px; color: var(--text-primary);
    font-family: 'Barlow', sans-serif; font-size: 15px;
    outline: none; transition: border-color 0.2s;
  }
  .form-group input:focus { border-color: var(--green); }
  .form-group input::placeholder { color: var(--text-muted); }

  .btn-primary {
    width: 100%; padding: 14px;
    background: var(--green); border: none; border-radius: 10px;
    color: #0a0e14;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 17px; letter-spacing: 0.5px;
    cursor: pointer; transition: box-shadow 0.2s, transform 0.1s;
    margin-top: 6px; -webkit-tap-highlight-color: transparent;
  }
  .btn-primary:hover { box-shadow: 0 0 18px var(--green-glow); }
  .btn-primary:active { transform: scale(0.97); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

  .auth-switch { text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted); }
  .auth-switch button { background: none; border: none; color: var(--green); cursor: pointer; font-size: 13px; font-weight: 600; padding: 0; }

  /* ── LAYOUT ── */
  .app-shell { display: flex; min-height: 100vh; }

  /* Sidebar (desktop) */
  .sidebar {
    width: 240px; background: var(--bg-card);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 100;
  }
  .sidebar-logo { padding: 28px 24px 24px; border-bottom: 1px solid var(--border); }
  .sidebar-logo h1 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 26px; letter-spacing: -0.5px;
    color: var(--text-primary);
  }
  .sidebar-logo h1 span { color: var(--green); }
  .sidebar-nav { flex: 1; padding: 12px; overflow-y: auto; }
  .nav-label {
    font-size: 10px; font-weight: 600; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 1px;
    padding: 12px 12px 6px;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px;
    cursor: pointer; color: var(--text-secondary);
    font-size: 14px; font-weight: 500;
    transition: background 0.15s, color 0.15s; margin-bottom: 2px;
    -webkit-tap-highlight-color: transparent;
  }
  .nav-item:hover { background: var(--bg-card-hover); color: var(--text-primary); }
  .nav-item.active { background: var(--green-dim); color: var(--green); font-weight: 600; }
  .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
  .sidebar-bottom { padding: 16px 12px; border-top: 1px solid var(--border); }
  .user-row {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 8px; cursor: pointer;
  }
  .user-row:hover { background: var(--bg-card-hover); }
  .avatar-sm {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--green); color: #0a0e14;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 13px; flex-shrink: 0;
  }
  .user-row .user-info { flex: 1; min-width: 0; }
  .user-row .user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .user-row .user-email { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* Main content */
  .main-content { margin-left: 240px; flex: 1; min-height: 100vh; padding: 32px; max-width: 960px; }

  /* Mobile top bar */
  .mobile-topbar { display: none; }

  /* Page header */
  .page-header { margin-bottom: 28px; }
  .page-header h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 30px;
    color: var(--text-primary); letter-spacing: -0.3px;
  }
  .page-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }

  /* ── SHARED COMPONENTS ── */
  .card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 14px; padding: 20px; margin-bottom: 16px;
    transition: border-color 0.2s;
  }
  .card:hover { border-color: var(--border-hover); }
  .card-header {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 16px;
  }
  .card-header h3 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 18px; color: var(--text-primary);
  }
  .badge {
    display: inline-flex; align-items: center;
    padding: 3px 10px; border-radius: 20px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.5px;
  }
  .badge-green { background: var(--green-dim); color: var(--green); }
  .badge-gold  { background: var(--gold-dim);   color: var(--gold); }
  .badge-red   { background: rgba(255,77,77,0.12); color: var(--red); }
  .badge-muted { background: var(--border);     color: var(--text-muted); }

  /* ── PICKS ── */
  .pick-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; overflow: hidden; margin-bottom: 10px;
    transition: border-color 0.2s;
  }
  .pick-card:hover { border-color: var(--border-hover); }
  .pick-card-header {
    padding: 8px 16px; background: rgba(255,255,255,0.02);
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--border);
  }
  .pick-card-header span { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .matchup { display: flex; align-items: stretch; }
  .team-side {
    flex: 1; padding: 18px 12px;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px;
    cursor: pointer; transition: background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .team-side:hover { background: rgba(255,255,255,0.03); }
  .team-side.picked { background: var(--green-dim); }
  .team-side.picked .team-name-pick { color: var(--green); }
  .team-side:first-child { border-right: 1px solid var(--border); }
  .team-name-pick {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 17px;
    color: var(--text-primary); transition: color 0.2s;
  }
  .team-spread { font-size: 12px; color: var(--text-muted); font-weight: 500; }
  .vs-divider {
    display: flex; align-items: center; justify-content: center;
    padding: 0 8px;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 14px; color: var(--text-muted);
    background: rgba(255,255,255,0.015);
  }

  /* ── LEADERBOARD ── */
  .leaderboard-row {
    display: flex; align-items: center;
    padding: 12px 16px; border-radius: 10px; gap: 12px;
    transition: background 0.15s;
  }
  .leaderboard-row:hover { background: rgba(255,255,255,0.03); }
  .leaderboard-row.highlight { background: var(--green-dim); border: 1px solid rgba(57,255,90,0.2); }
  .rank {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 20px;
    color: var(--text-muted); width: 28px; text-align: center;
  }
  .rank.top1 { color: var(--gold); }
  .rank.top2 { color: #c0c0c0; }
  .rank.top3 { color: #cd7f32; }
  .lb-info { flex: 1; min-width: 0; }
  .lb-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
  .lb-champ { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
  .lb-champ span { color: var(--green); font-weight: 600; }
  .lb-points {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 22px; color: var(--text-primary);
  }
  .lb-points-label { font-size: 10px; color: var(--text-muted); text-align: right; }

  /* ── TABS ── */
  .tabs {
    display: flex; gap: 4px;
    background: rgba(255,255,255,0.04);
    border-radius: 10px; padding: 3px; margin-bottom: 20px;
  }
  .tab {
    flex: 1; padding: 9px 12px; border: none; background: none;
    border-radius: 8px; color: var(--text-muted);
    font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: background 0.15s, color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .tab:hover { color: var(--text-primary); }
  .tab.active { background: var(--bg-card); color: var(--green); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

  /* ── BRACKET ── */
  .bracket-scroll { overflow-x: auto; padding-bottom: 16px; }
  .bracket-container { display: flex; gap: 0; min-width: 900px; align-items: center; }
  .bracket-round {
    display: flex; flex-direction: column;
    justify-content: space-around; min-width: 140px; padding: 0 6px;
  }
  .bracket-round-label {
    font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
    font-size: 11px; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 1px;
    text-align: center; padding-bottom: 10px;
  }
  .bracket-matchup {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 8px; overflow: hidden; margin: 4px 0;
    transition: border-color 0.2s;
  }
  .bracket-matchup:hover { border-color: var(--border-hover); }
  .bracket-team {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 10px; cursor: pointer;
    transition: background 0.15s;
    font-size: 12px; font-weight: 500; color: var(--text-secondary);
    -webkit-tap-highlight-color: transparent;
  }
  .bracket-team:first-child { border-bottom: 1px solid var(--border); }
  .bracket-team:hover { background: rgba(255,255,255,0.04); }
  .bracket-team.picked { background: var(--green-dim); color: var(--green); font-weight: 600; }
  .bracket-team .seed {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 11px;
    color: var(--text-muted); width: 16px; text-align: center;
  }
  .bracket-team .bteam-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bracket-team .empty { color: var(--text-muted); font-style: italic; font-size: 11px; }
  .champion-box {
    background: linear-gradient(135deg, rgba(245,200,66,0.1), rgba(57,255,90,0.08));
    border: 1px solid rgba(245,200,66,0.25);
    border-radius: 12px; padding: 16px; text-align: center; min-width: 130px;
  }
  .champion-box .champ-label { font-size: 10px; font-weight: 700; color: var(--gold); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
  .champion-box .champ-name { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 18px; color: var(--text-primary); }
  .champion-box .champ-bonus { font-size: 11px; color: var(--gold); margin-top: 4px; }

  /* ── LEAGUES ── */
  .league-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; padding: 18px 20px; margin-bottom: 10px;
    display: flex; align-items: center; gap: 14px;
    transition: border-color 0.2s;
  }
  .league-card:hover { border-color: var(--border-hover); }
  .league-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--green-dim);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 14px; color: var(--green); flex-shrink: 0;
  }
  .league-card-info { flex: 1; min-width: 0; }
  .league-card-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
  .league-card-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .btn-sm {
    padding: 8px 16px; border-radius: 8px;
    font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: opacity 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-sm:hover { opacity: 0.8; }
  .btn-sm.green { background: var(--green); color: #0a0e14; }
  .btn-sm.outline { background: transparent; border: 1px solid var(--border); color: var(--text-secondary); }
  .btn-sm.outline:hover { border-color: var(--green); color: var(--green); }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); z-index: 200;
    display: flex; align-items: flex-end; justify-content: center;
    backdrop-filter: blur(3px);
  }
  .modal {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 20px 20px 0 0;
    padding: 24px; width: 100%; max-width: 480px;
    max-height: 85vh; overflow-y: auto;
  }
  .modal-handle {
    width: 40px; height: 4px; background: var(--border);
    border-radius: 2px; margin: 0 auto 20px;
  }
  .modal h3 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 22px; margin-bottom: 16px;
  }
  .modal-actions { display: flex; gap: 10px; margin-top: 24px; }
  .modal-actions button { flex: 1; }
  .btn-cancel {
    padding: 13px; border-radius: 10px;
    background: transparent; border: 1px solid var(--border);
    color: var(--text-secondary);
    font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer;
  }
  .btn-cancel:hover { border-color: var(--text-muted); }

  /* ── DASHBOARD STATS ── */
  .stats-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 20px;
  }
  .stat-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 12px; padding: 18px;
  }
  .stat-label { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; }
  .stat-value {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 32px;
    color: var(--text-primary); margin-top: 4px;
  }
  .stat-value span { color: var(--green); }
  .stat-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .week-nav { display: flex; align-items: center; gap: 12px; }
  .week-nav button {
    background: var(--bg-input); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text-secondary);
    width: 34px; height: 34px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 16px;
    -webkit-tap-highlight-color: transparent;
  }
  .week-nav button:hover { border-color: var(--green); color: var(--green); }
  .week-nav .week-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }

  /* ── CHAMPION PICK SCREEN ── */
  .champ-hero {
    text-align: center; padding: 28px 0 20px;
    position: relative;
  }
  .champ-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 80% at 50% 40%, rgba(245,200,66,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .champ-hero-icon {
    width: 56px; height: 56px; margin: 0 auto 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(245,200,66,0.2), rgba(245,200,66,0.08));
    border: 1px solid rgba(245,200,66,0.3);
    display: flex; align-items: center; justify-content: center;
    position: relative; z-index: 1;
  }
  .champ-hero-icon svg { width: 28px; height: 28px; color: var(--gold); }
  .champ-hero h2 {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 28px;
    color: var(--text-primary); position: relative; z-index: 1;
  }
  .champ-hero p { color: var(--text-muted); font-size: 14px; margin-top: 6px; position: relative; z-index: 1; }
  .champ-bonus-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--gold-dim); border: 1px solid rgba(245,200,66,0.25);
    border-radius: 20px; padding: 5px 14px;
    margin-top: 12px; position: relative; z-index: 1;
  }
  .champ-bonus-pill span { color: var(--gold); font-size: 13px; font-weight: 600; }

  /* Team grid */
  .team-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 10px; margin-top: 8px;
  }
  .team-pick-card {
    background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 14px; padding: 18px 16px;
    cursor: pointer; transition: border-color 0.2s, transform 0.15s, background 0.2s;
    -webkit-tap-highlight-color: transparent;
    position: relative; overflow: hidden;
  }
  .team-pick-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    opacity: 0; transition: opacity 0.2s;
  }
  .team-pick-card:hover { border-color: var(--border-hover); transform: translateY(-1px); }
  .team-pick-card:active { transform: scale(0.97); }
  .team-pick-card.selected {
    border-color: var(--gold);
    background: linear-gradient(135deg, rgba(245,200,66,0.06), rgba(245,200,66,0.02));
  }
  .team-pick-card.selected::before { opacity: 1; background: var(--gold); }
  .team-pick-top { display: flex; align-items: center; gap: 10px; }
  .team-pick-seed {
    width: 28px; height: 28px; border-radius: 8px;
    background: var(--bg-input); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 14px; color: var(--text-muted);
    flex-shrink: 0;
  }
  .team-pick-seed.seeded { color: var(--gold); border-color: rgba(245,200,66,0.25); background: var(--gold-dim); }
  .team-pick-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 700; font-size: 18px; color: var(--text-primary);
  }
  .team-pick-card.selected .team-pick-name { color: var(--gold); }
  .team-pick-meta { font-size: 12px; color: var(--text-muted); margin-top: 6px; display: flex; gap: 12px; }
  .team-pick-meta span { display: flex; align-items: center; gap: 4px; }

  /* Detail panel (shown when a team is tapped) */
  .team-detail-overlay {
    position: fixed; inset: 0; z-index: 150;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .team-detail-panel {
    background: var(--bg-card); border-radius: 20px 20px 0 0;
    border-top: 1px solid var(--border);
    width: 100%; max-width: 480px;
    padding: 0 24px 32px;
    animation: slideUp 0.25s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  .detail-handle { width: 40px; height: 4px; background: var(--border); border-radius: 2px; margin: 14px auto 20px; }
  .detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
  .detail-seed-big {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--gold-dim); border: 1px solid rgba(245,200,66,0.3);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 20px; color: var(--gold);
    flex-shrink: 0;
  }
  .detail-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 24px; color: var(--text-primary);
  }
  .detail-conf { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
  .detail-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px; margin-bottom: 20px;
  }
  .detail-stat {
    background: var(--bg-input); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px 12px; text-align: center;
  }
  .detail-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
  .detail-stat-val {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 22px; color: var(--text-primary); margin-top: 3px;
  }
  .detail-bonus-note {
    background: linear-gradient(135deg, rgba(245,200,66,0.08), rgba(57,255,90,0.05));
    border: 1px solid rgba(245,200,66,0.2);
    border-radius: 12px; padding: 14px 16px;
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 20px;
  }
  .detail-bonus-note .bonus-icon { color: var(--gold); flex-shrink: 0; }
  .detail-bonus-note .bonus-text { font-size: 13px; color: var(--text-secondary); }
  .detail-bonus-note .bonus-text strong { color: var(--gold); }
  .btn-lock {
    width: 100%; padding: 15px;
    background: linear-gradient(135deg, #f5c842, #e6b830);
    border: none; border-radius: 12px;
    color: #0a0e14;
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 18px; letter-spacing: 0.5px;
    cursor: pointer; transition: box-shadow 0.2s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
  }
  .btn-lock:hover { box-shadow: 0 0 20px rgba(245,200,66,0.35); }
  .btn-lock:active { transform: scale(0.97); }

  /* Locked state on champion pick screen */
  .champ-locked-card {
    background: linear-gradient(135deg, rgba(245,200,66,0.1), rgba(245,200,66,0.03));
    border: 1px solid rgba(245,200,66,0.3);
    border-radius: 16px; padding: 24px;
    text-align: center; margin-top: 12px;
  }
  .champ-locked-label { font-size: 11px; color: var(--gold); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .champ-locked-name {
    font-family: 'Barlow Condensed', sans-serif;
    font-weight: 800; font-size: 32px; color: var(--text-primary);
  }
  .champ-locked-sub { font-size: 13px; color: var(--text-muted); margin-top: 6px; }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fadeUp 0.3s ease forwards; }
  .fade-up-delay-1 { animation-delay: 0.05s; opacity: 0; }
  .fade-up-delay-2 { animation-delay: 0.1s;  opacity: 0; }
  .fade-up-delay-3 { animation-delay: 0.15s; opacity: 0; }
  .fade-up-delay-4 { animation-delay: 0.2s;  opacity: 0; }

  /* ── MOBILE NAV (bottom) ── */
  .mobile-nav { display: none; }

  /* ═══════════════════════════════════════════════════════════
     MOBILE
     ═══════════════════════════════════════════════════════════ */
  @media (max-width: 700px) {
    .sidebar { display: none; }

    .mobile-topbar {
      display: flex; align-items: center; justify-content: space-between;
      position: fixed; top: 0; left: 0; right: 0; z-index: 90;
      background: var(--bg-card); border-bottom: 1px solid var(--border);
      padding: 12px 18px;
      /* safe area for notch */
      padding-top: max(12px, env(safe-area-inset-top, 12px));
    }
    .mobile-topbar h1 {
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 800; font-size: 22px; color: var(--text-primary);
    }
    .mobile-topbar h1 span { color: var(--green); }
    .mobile-topbar .topbar-right { display: flex; align-items: center; gap: 10px; }
    .mobile-topbar .avatar-sm { cursor: pointer; }

    .main-content {
      margin-left: 0;
      padding: 16px;
      /* top: mobile topbar ~50px, bottom: mobile nav ~70px */
      padding-top: max(68px, calc(50px + env(safe-area-inset-top, 0px)));
      padding-bottom: max(84px, calc(70px + env(safe-area-inset-bottom, 0px)));
    }

    .page-header { margin-bottom: 18px; }
    .page-header h2 { font-size: 24px; }

    /* Stats: 3 across on mobile but smaller */
    .stats-grid { gap: 8px; }
    .stat-card { padding: 14px 10px; border-radius: 10px; }
    .stat-value { font-size: 26px; }
    .stat-label { font-size: 10px; }
    .stat-sub { font-size: 11px; }

    /* Picks header row: stack */
    .picks-header-row { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
    .week-nav { gap: 8px; }

    /* Pick cards: bigger touch targets */
    .team-side { padding: 20px 8px; }
    .team-name-pick { font-size: 15px; }

    /* Leaderboard: tighter */
    .leaderboard-row { padding: 10px 8px; gap: 10px; }
    .lb-points { font-size: 18px; }

    /* Weekly breakdown: horizontal scroll friendly */
    .weekly-breakdown-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }

    /* Bracket: already scrolls horizontally, just reduce padding */
    .bracket-scroll { padding-bottom: 12px; }

    /* League cards: stack button below on narrow */
    .league-card { flex-wrap: wrap; }
    .league-card .btn-sm { margin-top: 4px; }

    /* Champion pick screen */
    .champ-hero { padding: 20px 0 16px; }
    .champ-hero h2 { font-size: 24px; }
    .team-grid { gap: 8px; }
    .team-pick-card { padding: 14px 12px; }
    .team-pick-name { font-size: 16px; }

    /* Detail panel stats */
    .detail-stats { gap: 8px; }
    .detail-stat { padding: 12px 8px; }
    .detail-stat-val { font-size: 20px; }

    /* Modal: full-width bottom sheet */
    .modal { border-radius: 20px 20px 0 0; padding: 20px; }

    /* Mobile bottom nav */
    .mobile-nav {
      display: flex;
      position: fixed; bottom: 0; left: 0; right: 0;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      padding: 6px 0;
      padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
      z-index: 100;
      justify-content: space-around;
    }
    .mobile-nav button {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      background: none; border: none; color: var(--text-muted);
      font-size: 10px; font-weight: 600; cursor: pointer;
      padding: 6px 10px; border-radius: 8px;
      -webkit-tap-highlight-color: transparent;
      flex: 1;
    }
    .mobile-nav button.active { color: var(--green); }
    .mobile-nav button svg { width: 22px; height: 22px; }
  }

  @media (min-width: 701px) {
    .mobile-topbar { display: none; }
  }
`;

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Icons = {
  dashboard:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  picks:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  leaderboard:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  bracket:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h12v-5"/><path d="M4 20v-5h12v5"/><path d="M16 6.5h4"/><path d="M16 17.5h4"/><line x1="20" y1="6.5" x2="20" y2="17.5"/></svg>,
  leagues:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  trophy:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C5 4 5 2 6 2h12c1 0 1 2 2.5 2a2.5 2.5 0 0 1 0 5H18"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 9h10v4a5 5 0 0 1-10 0z"/></svg>,
  chevronLeft:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  chevronRight: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  lock:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  star:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  back:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function LaxPicks({ authActions }) {
  const [page, setPage] = useState("dashboard");
  const [authMode, setAuthMode] = useState("login");
  const [picks, setPicks] = useState({});
  const [bracketPicks, setBracketPicks] = useState({});
  const [championPick, setChampionPick] = useState(null); // null = not yet picked
  const [championLocked, setChampionLocked] = useState(false);
  const [activeLeague, setActiveLeague] = useState(MOCK_LEAGUES[0]);
  const [leagueTab, setLeagueTab] = useState("my");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLeagueName, setNewLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Champion pick screen sub-state
  const [champHover, setChampHover] = useState(null);   // team id being previewed
  const [champDetail, setChampDetail] = useState(null);  // team id detail panel open

  // Auth form
  const [authEmail, setAuthEmail] = useState("");
  const [authPass,  setAuthPass]  = useState("");
  const [authName,  setAuthName]  = useState("");
  const [authError, setAuthError] = useState("");

 // Redirect to auth if not logged in
useEffect(() => {
    if (!authActions?.user) {
      setPage("auth");
    }
  }, [authActions?.user]);

  const handleLogin = async () => {
    if (!authEmail || !authPass) return;
    setAuthError("");
    try {
      await authActions.login(authEmail, authPass);
      setPage("dashboard");
    } catch (err) {
      setAuthError(err.message);
    }
  };
  
  const handleSignup = async () => {
    if (!authEmail || !authPass || !authName) return;
  setAuthError("");
  try {
    const userCredential = await authActions.signup(authEmail, authPass);
    await createUserProfile(userCredential.user.uid, authEmail, authName);
    setPage("dashboard");
  } catch (err) {
    setAuthError(err.message);
  }
};

  const handlePick = (gameId, teamId) => setPicks((p) => ({ ...p, [gameId]: teamId }));
  const handleBracketPick = (matchupId, teamId) => setBracketPicks((p) => ({ ...p, [matchupId]: teamId }));

  // ── AUTH ───────────────────────────────────────────────────────────────────
  if (page === "auth") {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div className="auth-wrap">
          <div className="auth-card fade-up">
            <div className="auth-logo">
              <h1>Lax<span>Picks</span></h1>
              <p>NCAA Lacrosse Pick'em & Brackets</p>
            </div>
            <h2>{authMode === "login" ? "Welcome Back" : "Create Account"}</h2>
            {authError && <div style={{color: '#ff4444', fontSize: 13, marginBottom: 12}}>{authError}</div>}
            {authMode === "signup" && (
              <div className="form-group">
                <label>Name</label>
                <input placeholder="Your name" value={authName} onChange={(e) => setAuthName(e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="you@email.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={authPass} onChange={(e) => setAuthPass(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={authMode === "login" ? handleLogin : handleSignup}>
              {authMode === "login" ? "Sign In" : "Create Account"}
            </button>
            <div className="auth-switch">
              {authMode === "login"
                ? <>Don't have an account? <button onClick={() => setAuthMode("signup")}>Sign Up</button></>
                : <>Already have an account? <button onClick={() => setAuthMode("login")}>Sign In</button></>
              }
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── SHARED NAV ─────────────────────────────────────────────────────────────
  const navItems = [
    { id: "dashboard",  label: "Dashboard",   icon: Icons.dashboard },
    { id: "picks",      label: "This Week",   icon: Icons.picks },
    { id: "champion",   label: "Champion",    icon: Icons.trophy },
    { id: "leaderboard",label: "Leaderboard", icon: Icons.leaderboard },
    { id: "bracket",    label: "Bracket",     icon: Icons.bracket },
    { id: "leagues",    label: "Leagues",     icon: Icons.leagues },
  ];

  const renderSidebar = () => (
    <nav className="sidebar">
      <div className="sidebar-logo"><h1>Lax<span>Picks</span></h1></div>
      <div className="sidebar-nav">
        <div className="nav-label">Main</div>
        {navItems.map((item) => (
          <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
            {item.icon}<span>{item.label}</span>
          </div>
        ))}
        <div className="nav-label" style={{ marginTop: 16 }}>My Leagues</div>
        {MOCK_LEAGUES.map((league) => (
          <div key={league.id} className={`nav-item ${activeLeague?.id === league.id && page === "leaderboard" ? "active" : ""}`}
            onClick={() => { setActiveLeague(league); setPage("leaderboard"); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
            <span>{league.name}</span>
          </div>
        ))}
      </div>
      <div className="sidebar-bottom">
        <div className="user-row" onClick={() => { authActions.logout(); setPage("auth"); }}>
          <div className="avatar-sm">{authActions?.user?.email?.slice(0,2).toUpperCase() || "YO"}</div>
          <div className="user-info">
            <div className="user-name">{authActions?.user?.displayName || "You"}</div>
            <div className="user-email">{authActions?.user?.email}</div>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderMobileTopbar = () => (
    <div className="mobile-topbar">
      <h1>Lax<span>Picks</span></h1>
      <div className="topbar-right">
        <div className="avatar-sm" onClick={() => { authActions.logout(); setPage("auth"); }}>{authActions?.user?.email?.slice(0,2).toUpperCase() || "YO"}</div>
      </div>
    </div>
  );

  const renderMobileNav = () => (
    <div className="mobile-nav">
      {navItems.map((item) => (
        <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}>
          {item.icon}<span>{item.label}</span>
        </button>
      ))}
    </div>
  );

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const myPts    = activeLeague?.members.find(m => m.name === "You")?.totalPoints || 262;
    const myRank   = [...(activeLeague?.members || [])].sort((a,b) => b.totalPoints - a.totalPoints).findIndex(m => m.name === "You") + 1;
    const picksThisWeek = Object.keys(picks).length;
    return (
      <div>
        <div className="page-header fade-up">
          <h2>Dashboard</h2>
          <p>Spring 2026 Season · Week 8</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card fade-up fade-up-delay-1">
            <div className="stat-label">Your Points</div>
            <div className="stat-value">{myPts}<span>pts</span></div>
            <div className="stat-sub">in {activeLeague?.name}</div>
          </div>
          <div className="stat-card fade-up fade-up-delay-2">
            <div className="stat-label">League Rank</div>
            <div className="stat-value">#{myRank}</div>
            <div className="stat-sub">of {activeLeague?.members.length} players</div>
          </div>
          <div className="stat-card fade-up fade-up-delay-3">
            <div className="stat-label">Picks</div>
            <div className="stat-value">{picksThisWeek}<span>/8</span></div>
            <div className="stat-sub">{picksThisWeek === 8 ? "All locked ✓" : "Open"}</div>
          </div>
        </div>

        {/* Champion preview card */}
        <div className="card fade-up fade-up-delay-2" style={{ cursor: "pointer" }} onClick={() => setPage("champion")}>
          <div className="card-header">
            <h3>🏆 Champion Pick</h3>
            <span className="badge badge-gold">+{CHAMPION_BONUS} pts</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--gold-dim)", border: "1px solid rgba(245,200,66,0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)" }}>
              {Icons.trophy}
            </div>
            <div>
              {championLocked
                ? <><div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{getTeam(championPick)?.name}</div>
                     <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Locked for the season</div></>
                : <><div style={{ fontSize: 15, fontWeight: 600, color: "var(--gold)" }}>Pick your champion →</div>
                     <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Choose before the tournament starts</div></>
              }
            </div>
          </div>
        </div>

        {/* Quick link to picks */}
        <div className="card fade-up fade-up-delay-3" style={{ cursor: "pointer" }} onClick={() => setPage("picks")}>
          <div className="card-header">
            <h3>This Week's Slate</h3>
            <span className="badge badge-green">8 Games</span>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
            {picksThisWeek < 8 ? `You have ${8 - picksThisWeek} picks remaining →` : "All picks locked. View results →"}
          </div>
        </div>
      </div>
    );
  };

  // ── CHAMPION PICK SCREEN ───────────────────────────────────────────────────
  const renderChampion = () => {
    // If already locked, show locked state
    if (championLocked) {
      const team = getTeam(championPick);
      return (
        <div>
          <div className="page-header fade-up">
            <h2>Champion Pick</h2>
            <p>Your tournament champion is locked in</p>
          </div>
          <div className="champ-locked-card fade-up fade-up-delay-1">
            <div style={{ color: "var(--gold)", marginBottom: 12 }}>{Icons.trophy}</div>
            <div className="champ-locked-label">Your Champion</div>
            <div className="champ-locked-name">{team?.name}</div>
            <div className="champ-locked-sub">#{team?.seed} seed · {team?.conf} · {team?.record}</div>
            <div style={{ marginTop: 16 }}>
              <span className="badge badge-gold" style={{ fontSize: 12, padding: "5px 14px" }}>+{CHAMPION_BONUS} pts if they win it all</span>
            </div>
          </div>
          <div className="card fade-up fade-up-delay-2" style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
              Champion picks are locked for the duration of the season. They reopen next preseason.
            </p>
          </div>
        </div>
      );
    }

    // Browse / pick state
    return (
      <div>
        <div className="champ-hero fade-up">
          <div className="champ-hero-icon">{Icons.trophy}</div>
          <h2>Pick Your Champion</h2>
          <p>Who's cutting down the nets in May?</p>
          <div className="champ-bonus-pill">
            <span>🏆 +{CHAMPION_BONUS} bonus points</span>
          </div>
        </div>

        <div className="team-grid">
          {CHAMPION_CANDIDATES.map((id, i) => {
            const team = getTeam(id);
            const isSelected = championPick === id;
            return (
              <div
                key={id}
                className={`team-pick-card fade-up ${isSelected ? "selected" : ""}`}
                style={{ animationDelay: `${0.06 + i * 0.05}s`, opacity: 0 }}
                onClick={() => setChampDetail(id)}
              >
                <div className="team-pick-top">
                  <div className={`team-pick-seed ${team.seed ? "seeded" : ""}`}>{team.seed || "—"}</div>
                  <div className="team-pick-name">{team.name}</div>
                  {isSelected && <span style={{ color: "var(--gold)", marginLeft: "auto", flexShrink: 0 }}>{Icons.star}</span>}
                </div>
                <div className="team-pick-meta">
                  <span>{team.conf}</span>
                  <span>· {team.record}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA if someone is selected but not locked */}
        {championPick && (
          <div className="card fade-up" style={{ marginTop: 16, textAlign: "center", padding: "20px 16px" }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
              Tap a team to see details, or lock in your pick now
            </div>
            <button className="btn-lock" onClick={() => setChampionLocked(true)}>
              Lock In {getTeam(championPick)?.name} as Champion
            </button>
          </div>
        )}

        {/* Detail panel (bottom sheet) */}
        {champDetail && (
          <div className="team-detail-overlay" onClick={() => setChampDetail(null)}>
            <div className="team-detail-panel" onClick={(e) => e.stopPropagation()}>
              <div className="detail-handle"></div>
              {(() => {
                const t = getTeam(champDetail);
                const isSelected = championPick === champDetail;
                return (
                  <>
                    <div className="detail-header">
                      <div className="detail-seed-big">{t.seed || "—"}</div>
                      <div>
                        <div className="detail-name">{t.name}</div>
                        <div className="detail-conf">{t.conf} Conference</div>
                      </div>
                    </div>
                    <div className="detail-stats">
                      <div className="detail-stat">
                        <div className="detail-stat-label">Record</div>
                        <div className="detail-stat-val">{t.record}</div>
                      </div>
                      <div className="detail-stat">
                        <div className="detail-stat-label">Seed</div>
                        <div className="detail-stat-val" style={{ color: t.seed ? "var(--gold)" : "var(--text-muted)" }}>{t.seed || "—"}</div>
                      </div>
                      <div className="detail-stat">
                        <div className="detail-stat-label">Conf</div>
                        <div className="detail-stat-val" style={{ fontSize: 16 }}>{t.conf.split(" ")[0]}</div>
                      </div>
                    </div>
                    <div className="detail-bonus-note">
                      <div className="bonus-icon">{Icons.trophy}</div>
                      <div className="bonus-text">If <strong>{t.name}</strong> wins the championship, you earn <strong>+{CHAMPION_BONUS} bonus points</strong> — the single biggest scoring opportunity in the league.</div>
                    </div>
                    {isSelected ? (
                      <button className="btn-lock" onClick={() => { setChampionLocked(true); setChampDetail(null); }}>
                        Lock In {t.name} as Champion
                      </button>
                    ) : (
                      <button className="btn-lock" style={{ background: "linear-gradient(135deg, var(--green), #2de64a)", color: "#0a0e14" }}
                        onClick={() => { setChampionPick(champDetail); setChampDetail(null); }}>
                        Select {t.name}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── WEEKLY PICKS ───────────────────────────────────────────────────────────
  const renderPicks = () => (
    <div>
      <div className="page-header fade-up picks-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>This Week's Picks</h2>
          <p>Week 8 · Pick against the spread</p>
        </div>
        <div className="week-nav">
          <button>{Icons.chevronLeft}</button>
          <span className="week-label">Week 8</span>
          <button style={{ opacity: 0.3, cursor: "default" }}>{Icons.chevronRight}</button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span className="badge badge-green" style={{ fontSize: 12 }}>{Object.keys(picks).length} / 8 picked</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Picks lock at kickoff</span>
      </div>
      {WEEKLY_SLATE.map((game, i) => {
        const home = getTeam(game.home);
        const away = getTeam(game.away);
        const pickedTeam = picks[game.id];
        return (
          <div className="pick-card fade-up" key={game.id} style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
            <div className="pick-card-header">
              <span>{game.time}</span>
              <span className="badge badge-muted">Upcoming</span>
            </div>
            <div className="matchup">
              <div className={`team-side ${pickedTeam === game.away ? "picked" : ""}`} onClick={() => handlePick(game.id, game.away)}>
                <div className="team-name-pick">{away.name}</div>
                <div className="team-spread">{-game.spread > 0 ? `+${-game.spread}` : -game.spread}</div>
              </div>
              <div className="vs-divider">VS</div>
              <div className={`team-side ${pickedTeam === game.home ? "picked" : ""}`} onClick={() => handlePick(game.id, game.home)}>
                <div className="team-name-pick">{home.name}</div>
                <div className="team-spread">{game.spread}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── LEADERBOARD ────────────────────────────────────────────────────────────
  const renderLeaderboard = () => {
    const sorted = [...(activeLeague?.members || [])].sort((a, b) => b.totalPoints - a.totalPoints);
    return (
      <div>
        <div className="page-header fade-up">
          <h2>{activeLeague?.name}</h2>
          <p>Season Standings · {activeLeague?.members.length} Players</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {MOCK_LEAGUES.map((league) => (
            <button key={league.id} className={`btn-sm ${activeLeague?.id === league.id ? "green" : "outline"}`}
              onClick={() => setActiveLeague(league)}>{league.name}</button>
          ))}
        </div>
        <div className="card fade-up">
          {sorted.map((member, i) => {
            const isYou = member.name === "You";
            const rankClass = i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "";
            return (
              <div key={member.id} className={`leaderboard-row ${isYou ? "highlight" : ""}`}>
                <div className={`rank ${rankClass}`}>{i + 1}</div>
                <div className="avatar-sm" style={isYou ? { background: "var(--green)" } : { background: "var(--bg-input)", color: "var(--text-secondary)" }}>
                  {member.avatar}
                </div>
                <div className="lb-info">
                  <div className="lb-name">{member.name} {isYou && <span className="badge badge-green" style={{ marginLeft: 6, fontSize: 10, padding: "2px 6px" }}>YOU</span>}</div>
                  <div className="lb-champ">Champion: <span>{getTeam(member.championPick)?.name}</span></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="lb-points">{member.totalPoints}</div>
                  <div className="lb-points-label">points</div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Weekly breakdown */}
        <div className="card fade-up fade-up-delay-2" style={{ marginTop: 8 }}>
          <div className="card-header"><h3>Weekly Breakdown</h3></div>
          <div className="weekly-breakdown-wrap" style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", minWidth: 360 }}>
              <div style={{ minWidth: 90, flexShrink: 0 }}></div>
              {[1,2,3,4,5,6,7].map(w => (
                <div key={w} style={{ minWidth: 44, textAlign: "center", fontSize: 10, color: "var(--text-muted)", fontWeight: 600, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>Wk {w}</div>
              ))}
            </div>
            {sorted.map((member) => (
              <div key={member.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "8px 0" }}>
                <div style={{ minWidth: 90, flexShrink: 0, fontSize: 13, fontWeight: 600, color: member.name === "You" ? "var(--green)" : "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.name}</div>
                {member.weeklyPoints.map((pts, i) => (
                  <div key={i} style={{ minWidth: 44, textAlign: "center", fontSize: 13, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, color: pts >= 42 ? "var(--green)" : "var(--text-secondary)" }}>{pts}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── BRACKET ────────────────────────────────────────────────────────────────
  const renderBracket = () => {
    const resolveSlot = (slot) => (typeof slot === "number" ? slot : bracketPicks[slot] || null);
    const getTeamLabel = (slot) => { const id = resolveSlot(slot); return id ? getTeam(id) : null; };

    const renderMatchup = (matchup) => {
      const topTeam    = getTeamLabel(matchup.top);
      const bottomTeam = getTeamLabel(matchup.bottom);
      const pickedId   = bracketPicks[matchup.id];
      return (
        <div className="bracket-matchup" key={matchup.id}>
          <div className={`bracket-team ${pickedId === topTeam?.id ? "picked" : ""}`}
            onClick={() => topTeam && handleBracketPick(matchup.id, topTeam.id)}>
            <span className="seed">{topTeam?.seed || "—"}</span>
            <span className="bteam-name">{topTeam ? topTeam.name : <span className="empty">TBD</span>}</span>
          </div>
          <div className={`bracket-team ${pickedId === bottomTeam?.id ? "picked" : ""}`}
            onClick={() => bottomTeam && handleBracketPick(matchup.id, bottomTeam.id)}>
            <span className="seed">{bottomTeam?.seed || "—"}</span>
            <span className="bteam-name">{bottomTeam ? bottomTeam.name : <span className="empty">TBD</span>}</span>
          </div>
        </div>
      );
    };

    return (
      <div>
        <div className="page-header fade-up">
          <h2>Tournament Bracket</h2>
          <p>NCAA DI Men's Lacrosse Championship · Tap teams to pick</p>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div className="card" style={{ flex: 1, minWidth: 180, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: "var(--gold)" }}>{Icons.trophy}</div>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6 }}>Champion Pick</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginTop: 2 }}>
                {championLocked ? <>{getTeam(championPick)?.name} <span style={{ color: "var(--gold)", fontSize: 12 }}>+{CHAMPION_BONUS} pts</span></> : <span style={{ color: "var(--gold)" }}>Not picked yet</span>}
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center" }}>
            <span className="badge badge-green" style={{ fontSize: 12 }}>{Object.keys(bracketPicks).length} / 17 picked</span>
          </div>
        </div>
        <div className="bracket-scroll fade-up">
          <div className="bracket-container">
            <div className="bracket-round">
              <div className="bracket-round-label">Opening</div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 120 }}>
                {BRACKET_DATA.opening.map(m => renderMatchup(m))}
              </div>
            </div>
            <div className="bracket-round">
              <div className="bracket-round-label">First Round</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {BRACKET_DATA.firstRound.map(m => renderMatchup(m))}
              </div>
            </div>
            <div className="bracket-round">
              <div className="bracket-round-label">Quarters</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                {BRACKET_DATA.quarterfinals.map(m => renderMatchup(m))}
              </div>
            </div>
            <div className="bracket-round">
              <div className="bracket-round-label">Semis</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 60 }}>
                {BRACKET_DATA.semifinals.map(m => renderMatchup(m))}
              </div>
            </div>
            <div className="bracket-round">
              <div className="bracket-round-label">Final</div>
              {renderMatchup(BRACKET_DATA.final)}
            </div>
            <div className="bracket-round" style={{ minWidth: 130 }}>
              <div className="bracket-round-label">Champion</div>
              <div className="champion-box">
                <div className="champ-label">🏆 Champion</div>
                <div className="champ-name">{bracketPicks["f1"] ? getTeam(bracketPicks["f1"])?.name : "Pick Final Winner"}</div>
                <div className="champ-bonus">+{CHAMPION_BONUS} bonus pts</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── LEAGUES ────────────────────────────────────────────────────────────────
  const renderLeagues = () => (
    <div>
      <div className="page-header fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2>Leagues</h2>
          <p>Create, join, or browse</p>
        </div>
        <button className="btn-sm green" onClick={() => setShowCreateModal(true)}>+ Create</button>
      </div>
      <div className="tabs fade-up">
        <button className={`tab ${leagueTab === "my" ? "active" : ""}`} onClick={() => setLeagueTab("my")}>My Leagues</button>
        <button className={`tab ${leagueTab === "browse" ? "active" : ""}`} onClick={() => setLeagueTab("browse")}>Browse</button>
        <button className={`tab ${leagueTab === "join" ? "active" : ""}`} onClick={() => setLeagueTab("join")}>Join Code</button>
      </div>
      {leagueTab === "my" && (
        <div className="fade-up">
          {MOCK_LEAGUES.map((league) => (
            <div className="league-card" key={league.id}>
              <div className="league-icon">{league.code}</div>
              <div className="league-card-info">
                <div className="league-card-name">{league.name}</div>
                <div className="league-card-meta">{league.members.length} members · Code: <strong>{league.code}</strong></div>
              </div>
              <button className="btn-sm outline" onClick={() => { setActiveLeague(league); setPage("leaderboard"); }}>Standings →</button>
            </div>
          ))}
        </div>
      )}
      {leagueTab === "browse" && (
        <div className="fade-up">
          {BROWSE_LEAGUES.map((league) => (
            <div className="league-card" key={league.id}>
              <div className="league-icon">{league.code}</div>
              <div className="league-card-info">
                <div className="league-card-name">{league.name}</div>
                <div className="league-card-meta">{league.memberCount} members</div>
              </div>
              <button className="btn-sm green">Join</button>
            </div>
          ))}
        </div>
      )}
      {leagueTab === "join" && (
        <div className="card fade-up" style={{ maxWidth: 400 }}>
          <h3 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Join by League Code</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Ask a friend for their league code.</p>
          <div className="form-group">
            <label>League Code</label>
            <input placeholder="e.g. FOFF" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} style={{ textTransform: "uppercase", letterSpacing: 2, fontSize: 18, fontWeight: 700 }} />
          </div>
          <button className="btn-primary" style={{ marginTop: 8 }} disabled={joinCode.length < 2}>Join League</button>
        </div>
      )}

      {/* Create League Modal (bottom sheet) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle"></div>
            <h3>Create a New League</h3>
            <div className="form-group">
              <label>League Name</label>
              <input placeholder="e.g. The Faceoff" value={newLeagueName} onChange={(e) => setNewLeagueName(e.target.value)} autoFocus />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <input placeholder="For the boys..." />
            </div>
            <div style={{ background: "var(--bg-input)", borderRadius: 10, padding: "12px 14px", marginTop: 4 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>A unique league code will be generated so friends can join.</div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
             <button className="btn-primary" style={{ width: "auto", flex: 1, margin: 0 }} disabled={!newLeagueName.trim()}
                onClick={async () => {
                  try {
                    const league = await createLeague(authActions.user.uid, newLeagueName);
                    setShowCreateModal(false);
                    setNewLeagueName("");
                    alert(`League created! Code: ${league.code}`);
                  } catch (err) {
                    alert("Error: " + err.message);
                  }
                }}>Create League</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  const renderPage = () => {
    switch (page) {
      case "dashboard":   return renderDashboard();
      case "picks":       return renderPicks();
      case "champion":    return renderChampion();
      case "leaderboard": return renderLeaderboard();
      case "bracket":     return renderBracket();
      case "leagues":     return renderLeagues();
      default:            return renderDashboard();
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      {renderMobileTopbar()}
      <div className="app-shell">
        {renderSidebar()}
        <main className="main-content">
          {renderPage()}
        </main>
        {renderMobileNav()}
      </div>
    </>
  );
}
