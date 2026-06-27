import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/http";

// ─── Navbar_res ──────────────────────────────────────────────────────────────
// Sticky top navbar shown during active game sessions.
// Props:
//   pin   – game PIN to display (falls back to URL params / location state)
//   score – optional numeric score to show; falls back to player count
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar_res({ pin, score }) {
  const location = useLocation();
  const params   = useParams();

  const [user,        setUser]        = useState(null);
  const [roomCode,    setRoomCode]    = useState(pin || null);
  const [playerCount, setPlayerCount] = useState(null);
  const [scoreValue,  setScoreValue]  = useState(
    typeof score === "number" ? score : undefined
  );

  // PIN resolved in priority order: prop → URL param → navigation state
  const resolvedPin =
    pin ||
    params.pin ||
    location.state?.pin ||
    location.state?.roomCode;

  // ── Load user from localStorage on mount ────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw && raw !== "undefined") setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem("user");
    }
  }, []);

  // ── Fetch room info + score whenever the PIN changes ────────────────────
  useEffect(() => {
    if (!resolvedPin) return;

    const fetchRoomInfo = async () => {
      try {
        // Room info (player count, status)
        const { data: room } = await api.get(`/api/rooms/${resolvedPin}`);
        setRoomCode(room.roomCode || resolvedPin);
        setPlayerCount(room.players?.length ?? 0);

        // Score — only override the prop if we find a match in results
        const { data: results } = await api.get(`/api/games/${resolvedPin}/results`);
        const raw = localStorage.getItem("user");

        if (raw) {
          const parsedUser  = JSON.parse(raw);
          const matchedItem = results?.find(
            (item) =>
              item.nickname  === parsedUser.fullName ||
              item.playerId  === parsedUser.id
          );
          if (matchedItem?.totalScore != null) {
            setScoreValue(matchedItem.totalScore);
          }
        }
      } catch (err) {
        console.error("Navbar fetch error:", err);
      }
    };

    fetchRoomInfo();
  }, [resolvedPin]);

  // ── Derived display values ───────────────────────────────────────────────
  const displayPin = roomCode || resolvedPin || "------";

  // Show the numeric score if available, otherwise fall back to player count
  const displayRight =
    scoreValue !== undefined
      ? { label: scoreValue, isScore: true }
      : playerCount != null
      ? { label: `${playerCount-1} players`, isScore: false }
      : { label: "—", isScore: false };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md">
      {/* Inner row — constrained to the same max-width as page content */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8 lg:px-10">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
            Q
          </div>
          <span className="text-xl font-bold text-emerald-600">QuizUp</span>
        </Link>

        {/* Right-side badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Game PIN badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white sm:text-sm">
            <span className="text-slate-400 tracking-wide">PIN</span>
            <span className="text-white">{displayPin}</span>
          </div>

          {/* Score / player-count badge */}
          <div className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-xs font-semibold text-white sm:text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-yellow-800 text-xs leading-none">
              ★
            </span>
            <span>{displayRight.label}</span>
          </div>
        </div>
      </div>

      {/* Subtle divider — a thin 1 px line, not a heavy shadow */}
      <div className="h-px bg-slate-100" />
    </header>
  );
}