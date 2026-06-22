import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api/http";
import { createStompClient } from "../api/websocket";
import Navbar_res from "../components/Navbar_res";
import QRCode from "react-qr-code";

// Creates a circular SVG avatar image using the player's initials and a gradient color.
// 'name' is used to extract initials; 'from' and 'to' are the gradient start/end colors.
// Returns a data URL string that can be used directly as an <img> src.
const createAvatar = (name, from, to) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
			<defs>
				<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" stop-color="${from}" />
					<stop offset="100%" stop-color="${to}" />
				</linearGradient>
			</defs>
			<rect width="96" height="96" rx="48" fill="url(#g)" />
			<circle cx="48" cy="38" r="18" fill="rgba(255,255,255,0.9)" />
			<path d="M22 84c5-15 16-23 26-23s21 8 26 23" fill="rgba(255,255,255,0.9)" />
			<text x="48" y="56" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" font-weight="700" fill="#ffffff">${initials}</text>
		</svg>
	`.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// Main component for the host's waiting lobby.
// Shows all joined players in real time and lets the host start the game
// once enough players have joined.
function LobbyHost() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const locationState = location.state || {};

  const gamePin =
    params.pin || locationState.pin || locationState.roomCode || "123456";

  const joinUrl = `${window.location.origin}/join/${gamePin}`;
  const [copied, setCopied] = useState(false);

  // True while the start-game API call is in progress (disables the Start button)
  const [isStarting, setIsStarting] = useState(false);

  // Error message shown below the Start button if the API call fails
  const [startError, setStartError] = useState("");

  // Build the host's own user object from navigation state
  const currentUser = {
    id: locationState.hostId || "host-user",
    name: locationState.hostName || "Berk",
    avatar: createAvatar(
      locationState.hostName || "Berk",
      "#2dd4bf",
      "#14b8a6",
    ),
  };

  // Resolve the game PIN from URL params or navigation state (fallback: '123456')

  // Live list of non-host players who have joined the lobby
  const [players, setPlayers] = useState([]);

  // On mount: fetches current players from the REST API, then opens a WebSocket
  // connection to receive real-time PLAYER_JOINED events.
  // Cleans up the WebSocket on unmount.
  useEffect(() => {
    if (!gamePin) {
      return undefined;
    }

    // Loads the current player list from the server when the lobby first opens
    const loadRoom = async () => {
      try {
        const response = await api.get(`/api/rooms/${gamePin}`);
        const roomPlayers = response.data?.players || [];
        // Filter out the host so only regular players are shown
        setPlayers(roomPlayers.filter((player) => !player.host));
      } catch (error) {
        // Keep the lobby usable even if the initial load fails.
      }
    };

    loadRoom();

    // Create a STOMP WebSocket client and subscribe to the room topic
    const client = createStompClient();
    client.onConnect = () => {
      client.subscribe(`/topic/room/${gamePin}`, (message) => {
        try {
          const event = JSON.parse(message.body);
          const payload = event.data ?? event.payload ?? {};

          if (event.type === "PLAYER_JOINED") {
            // A new player joined — update the list with the server's full player array
            setPlayers((previousPlayers) => {
              const nextPlayers = payload.players || previousPlayers;
              return nextPlayers.filter((player) => !player.host);
            });
          }
        } catch (error) {
          // Ignore malformed room events.
        }
      });
    };

    client.activate();

    // Disconnect WebSocket when the component unmounts
    return () => {
      client.deactivate();
    };
  }, [gamePin]);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };
  // Called when the host clicks the "Start" button.
  // Posts a start-game request to the server, then navigates to the live game screen.
  const handleStartGame = async () => {
    setStartError("");
    setIsStarting(true);

    try {
      await api.post("/api/games/start", {
        roomCode: gamePin,
      });

      // Navigate to the host's live game page, passing game info via state
      navigate(`/host-live-game/${gamePin}`, {
        state: {
          pin: gamePin,
          hostId: currentUser.id,
          hostName: currentUser.name,
        },
      });
    } catch (error) {
      // Show an error message below the button if the request fails
      setStartError(
        error?.response?.data?.message || "Unable to start the game",
      );
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-4 sm:px-8 lg:px-10">
        {/* Top header: QuizUp logo on the left, Game PIN badge on the right */}
        <Navbar_res pin={gamePin} />

        <main className="flex flex-1 flex-col justify-center pb-24 pt-1">
          <div className="max-w-5xl">
            <h1 className="text-[clamp(2.75rem,5vw,4.25rem)] font-extrabold tracking-tight text-slate-900">
              You're the Host!
            </h1>

            <p className="mt-3 text-lg text-slate-500">
              Waiting for players to join...
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            {/* Player list section — shows everyone who has joined so far */}
            <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="flex items-center justify-between px-2 pb-5 pt-1">
                <h2 className="text-2xl font-bold text-slate-900">Players</h2>
                {/* Badge showing the number of players currently in the lobby */}
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-emerald-500">
                  {players.length} joined
                </span>
              </div>

              <div className="space-y-3">
                {/* Render a card for each player; highlight the host's own card */}
                {players.map((player) => {
                  const isCurrentUser = false;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition ${
                        isCurrentUser
                          ? "border border-violet-200 bg-violet-50/70 shadow-[0_8px_20px_rgba(168,85,247,0.08)]"
                          : "border border-transparent bg-slate-50/80"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          src={createAvatar(
                            player.nickname || player.name || "User",
                            "#ff7a59",
                            "#ff4d8d",
                          )}
                          alt={`${player.nickname || player.name} avatar`}
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-slate-800">
                            {player.nickname || player.name}
                          </p>
                        </div>
                      </div>

                      {/* "Host" badge shown next to the host's own entry */}
                      {isCurrentUser ? (
                        <span className="ml-4 shrink-0 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                          Host
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Right sidebar: decorative "Getting Ready" card and the Start button */}
            <aside className="flex flex-col items-center">
              <div className="w-full overflow-hidden rounded-[22px] bg-linear-to-b from-[#d98cff] via-[#bf7bff] to-[#9448ef] shadow-[0_18px_36px_rgba(138,75,255,0.18)]">
                {/* Decorative illustration area (piano-key shapes) */}
                

                {/* Status text below the illustration */}
                <div className="bg-[#f7efff] px-4 py-5 text-center">
                  <p className="text-lg font-bold text-emerald-500">
                    Scan To Join
                  </p>

                  <div className="mt-4 flex justify-center">
                    <div className="rounded-xl bg-white p-3 shadow-lg">
                      <QRCode value={joinUrl} size={140} />
                    </div>
                  </div>

                  <p className="mt-3 text-lg font-bold text-slate-700">
                    PIN: {gamePin}
                  </p>

                  <p className="mt-2 break-all text-xs text-slate-500">
                    {joinUrl}
                  </p>

                  <button
                    onClick={copyLink}
                    className="mt-4 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                  >
                    {copied ? "Copied!" : "Copy Invite Link"}
                  </button>

                  <p className="mt-3 text-sm text-emerald-500/80">
                    Players can scan this QR code or use the room PIN.
                  </p>
                </div>
              </div>
              

              {/* Start button — disabled while the API call is in progress */}
              <button
                type="button"
                onClick={handleStartGame}
                disabled={isStarting}
                className="mt-8 inline-flex w-44 items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(16,185,129,0.28)]"
              >
                {isStarting ? "Starting..." : "Start"}
              </button>

              {/* Error message shown if starting the game fails */}
              {startError ? (
                <p className="mt-3 max-w-xs text-center text-sm font-medium text-red-500">
                  {startError}
                </p>
              ) : null}
            </aside>
          </div>
        </main>

        {/* Fixed footer tip and status label */}
        <footer className="fixed inset-x-0 bottom-5 px-5 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl rounded-2xl border border-amber-200 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-700 shadow-sm backdrop-blur">
              <span className="mr-2">💡</span>
              Tip: Prepare your players! The game is about to begin.
            </div>

            <div className="rounded-full bg-white px-6 py-3 text-sm font-medium text-slate-500 shadow-[0_8px_22px_rgba(15,23,42,0.14)]">
              Waiting for players...
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default LobbyHost;
