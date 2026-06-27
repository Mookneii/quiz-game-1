import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/http";
import { createStompClient } from "../api/websocket";
import Navbar_res from "../components/Navbar_res";
import QRCode from "react-qr-code";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Generates a circular SVG avatar from a player's initials.
 * Returns a data URL usable directly as an <img src>.
 */
const createAvatar = (name, fromColor, toColor) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${fromColor}" />
          <stop offset="100%" stop-color="${toColor}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="48" fill="url(#g)" />
      <circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.9)" />
      <path d="M22 84c5-15 16-23 26-23s21 8 26 23" fill="rgba(255,255,255,0.9)" />
      <text x="48" y="56" text-anchor="middle" font-size="22" font-family="Arial, sans-serif"
        font-weight="700" fill="#ffffff">${initials}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const PLAYER_AVATAR_COLORS = { from: "#ff7a59", to: "#ff4d8d" };
const HOST_AVATAR_COLORS   = { from: "#2dd4bf", to: "#14b8a6" };

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Single row in the player list. */
function PlayerCard({ player }) {
  const displayName = player.nickname || player.name || "Unknown";

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-transparent bg-slate-50/80 px-4 py-3 transition">
      <img
        src={createAvatar(displayName, PLAYER_AVATAR_COLORS.from, PLAYER_AVATAR_COLORS.to)}
        alt={`${displayName} avatar`}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
      <p className="truncate text-base font-semibold text-slate-800">{displayName}</p>
    </div>
  );
}

/** QR code + PIN + copy-link sidebar card. */
function InviteCard({ joinUrl, gamePin }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard write failed:", err);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-[22px] bg-gradient-to-b from-[#d98cff] via-[#bf7bff] to-[#9448ef] shadow-[0_18px_36px_rgba(138,75,255,0.18)]">
      <div className="bg-[#f7efff] px-4 py-5 text-center">
        <p className="text-lg font-bold text-emerald-500">Scan To Join</p>

        <div className="mt-4 flex justify-center">
          <div className="rounded-xl bg-white p-3 shadow-lg">
            <QRCode value={joinUrl} size={140} />
          </div>
        </div>

        <p className="mt-3 text-lg font-bold text-slate-700">PIN: {gamePin}</p>

        <p className="mt-1 break-all text-xs text-slate-500">{joinUrl}</p>

        <button
          onClick={handleCopy}
          className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600 active:scale-95"
        >
          {copied ? "Copied!" : "Copy Invite Link"}
        </button>

        <p className="mt-3 text-sm text-emerald-500/80">
          Players can scan this QR code or enter the PIN.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

function LobbyHost() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const params        = useParams();
  const locationState = location.state || {};

  // Resolve game PIN from URL params first, then navigation state
  const gamePin = params.pin || locationState.pin || locationState.roomCode || "123456";
  const joinUrl = `${window.location.origin}/join/${gamePin}`;

  const hostName = locationState.hostName || "Host";
  const hostId   = locationState.hostId   || "host-user";

  // Non-host players currently in the lobby
  const [players, setPlayers] = useState([]);

  // Start-game request state
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  // ── WebSocket + initial fetch ──────────────────────────────────────────────
  useEffect(() => {
    if (!gamePin) return;

    /** Fetches the current player list once when the lobby mounts. */
    const loadPlayers = async () => {
      try {
        const { data } = await api.get(`/api/rooms/${gamePin}`);
        const nonHostPlayers = (data?.players || []).filter((p) => !p.host);
        setPlayers(nonHostPlayers);
      } catch {
        // Keep the lobby usable even if the initial fetch fails
      }
    };

    loadPlayers();

    // Open a STOMP WebSocket to receive live PLAYER_JOINED events
    const stompClient = createStompClient();

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/room/${gamePin}`, (message) => {
        try {
          const event   = JSON.parse(message.body);
          const payload = event.data ?? event.payload ?? {};

          if (event.type === "PLAYER_JOINED") {
            setPlayers((prev) => {
              const updated = payload.players || prev;
              return updated.filter((p) => !p.host);
            });
          }
        } catch {
          // Ignore malformed messages
        }
      });
    };

    stompClient.activate();

    return () => stompClient.deactivate();
  }, [gamePin]);

  // ── Start game ─────────────────────────────────────────────────────────────
  const handleStartGame = async () => {
    setStartError("");
    setIsStarting(true);

    try {
      await api.post("/api/games/start", { roomCode: gamePin });

      navigate(`/host-live-game/${gamePin}`, {
        state: { pin: gamePin, hostId, hostName },
      });
    } catch (err) {
      setStartError(err?.response?.data?.message || "Unable to start the game.");
    } finally {
      setIsStarting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Outer wrapper: fills the viewport and lets the page scroll naturally.
    // No fixed footer — everything lives in the normal document flow so
    // nothing gets clipped on small screens.
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-8 lg:px-10">

        {/* Header: logo + PIN badge */}
        <Navbar_res pin={gamePin} />

        {/* ── Main content ───────────────────────────────────────────────── */}
        <main className="flex flex-1 flex-col pt-4 pb-8">

          {/* Page title */}
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[4.25rem]">
              You're the Host!
            </h1>
            <p className="mt-3 text-lg text-slate-500">
              Waiting for players to join…
            </p>
          </div>

          {/*
            Two-column grid on large screens, single column on mobile.
            The sidebar column is fixed-width (260 px) on large screens;
            on smaller screens both sections stack and take full width.
          */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_260px] lg:items-start">

            {/* ── Player list ──────────────────────────────────────────── */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between px-2 pb-5 pt-1">
                <h2 className="text-2xl font-bold text-slate-900">Players</h2>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-emerald-500">
                  {players.length} joined
                </span>
              </div>

              <div className="space-y-3">
                {players.length === 0 ? (
                  <p className="px-2 text-sm text-slate-400">
                    No players yet — share the PIN or QR code to invite them.
                  </p>
                ) : (
                  players.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))
                )}
              </div>
            </section>

            {/*
              ── Right sidebar ──────────────────────────────────────────────
              On mobile this stacks below the player list and is full-width.
              On large screens it sits in its own 260 px column.
              `lg:sticky lg:top-6` keeps it anchored while the player list
              can grow taller — without clipping or a fixed footer overlay.
            */}
            <aside className="flex flex-col items-center gap-5 lg:sticky lg:top-6">
              <InviteCard joinUrl={joinUrl} gamePin={gamePin} />

              {/* Start button */}
              <button
                type="button"
                onClick={handleStartGame}
                disabled={isStarting}
                className="w-full max-w-[180px] rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(16,185,129,0.28)] transition hover:bg-emerald-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStarting ? "Starting…" : "Start Game"}
              </button>

              {startError && (
                <p className="max-w-xs text-center text-sm font-medium text-red-500">
                  {startError}
                </p>
              )}
            </aside>
          </div>

          {/*
            ── Footer tip bar ─────────────────────────────────────────────
            Sits in normal document flow (not fixed), so it never overlaps
            content. It naturally appears below both columns once they end.
          */}
          <div className="mt-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-700 shadow-sm">
              <span className="mr-2">💡</span>
              Tip: Make sure all players are ready before you start.
            </div>

            <div className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.14)] whitespace-nowrap">
              Waiting for players…
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

export default LobbyHost;