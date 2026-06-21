import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/http";

export default function Navbar_res({ pin, score }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState(pin || null);
  const [playerCount, setPlayerCount] = useState(null);
  const [roomStatus, setRoomStatus] = useState("");
  const [scoreValue, setScoreValue] = useState(
    typeof score === "number" ? score : undefined
  );

  const resolvedPin =
    pin || params.pin || location.state?.pin || location.state?.roomCode;

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser && storedUser !== "undefined") {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log("Invalid user data");
      localStorage.removeItem("user");
    }
  }, []);

  useEffect(() => {
    if (!resolvedPin) {
      return;
    }

    const fetchRoomInfo = async () => {
      try {
        const response = await api.get(`/api/rooms/${resolvedPin}`);
        const room = response.data;

        setRoomCode(room.roomCode || resolvedPin);
        setRoomStatus(room.status || "");
        setPlayerCount(room.players?.length ?? 0);

        const resultsResponse = await api.get(
          `/api/games/${resolvedPin}/results`
        );
        const results = resultsResponse.data;
        const storedUser = localStorage.getItem("user");
        let matchedScore;

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          matchedScore = results?.find(
            (item) =>
              item.nickname === parsedUser.fullName ||
              item.playerId === parsedUser.id
          )?.totalScore;
        }

        if (matchedScore != null) {
          setScoreValue(matchedScore);
        }
      } catch (error) {
        console.error("Navbar API error:", error);
      }
    };

    fetchRoomInfo();
  }, [resolvedPin]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const displayPin = roomCode || resolvedPin || "123456";
  const displayScore =
    scoreValue !== undefined
      ? scoreValue
      : playerCount != null
      ? `${playerCount-1} players`
      : 0;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
            Q
          </div>

          <span className="text-xl font-bold text-emerald-600">QuizUp</span>
        </Link>


        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-slate-500 px-5 py-2 text-sm font-semibold text-white shadow-sm">
            GAME PIN: <span className="text-gray-50">{displayPin}</span>
          </div>
          <div className="rounded-full bg-slate-500 px-5 py-2 text-sm font-semibold text-white shadow-sm flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300 text-yellow-700">★</span>
            {displayScore}
          </div>
        </div>
      </div>
    </header>
  );
}
