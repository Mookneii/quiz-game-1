import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function JoinGame() {
  const navigate = useNavigate();
  const { roomCode } = useParams();

  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roomCode) {
      setPin(roomCode);
    }
  }, [roomCode]);

  const handleJoin = async (e) => {
    e.preventDefault();

    setError("");

    if (!pin || !nickname) {
      setError("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://${window.location.hostname}:8080/api/rooms/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomCode: pin,
            nickname: nickname,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to join room");
      }

      const data = await response.json();

      navigate(`/lobby/${pin}`, {
        state: {
          nickname,
          playerId: data.playerId,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-linear-to-r from-blue-500 to-green-400 flex items-center justify-center px-6 py-16 overflow-hidden relative">
        {/* Glow Effects */}
        <div className="absolute top-32 right-40 w-32 h-32 bg-yellow-300 opacity-20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-32 right-20 w-40 h-40 bg-white opacity-20 blur-3xl rounded-full"></div>
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-yellow-200 opacity-30 blur-2xl rounded-full"></div>

        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-20 items-center">
          {/* LEFT CARD */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md mx-auto w-full">
            {/* Icon */}

            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                Q
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-center text-gray-800">
              Join a Game
            </h1>

            <p className="text-gray-500 text-center mt-4 leading-7">
              {roomCode
                ? `Joining room ${roomCode}`
                : "Enter the game PIN provided by your host"}
            </p>

            {/* FORM */}
            <form onSubmit={handleJoin} className="mt-10 space-y-6">
              {/* PIN */}
              <div>
                <label className="block text-sm font-semibold text-green-500 mb-2">
                  Game PIN
                </label>

                <input
                  type="text"
                  placeholder="Enter 6-digit PIN"
                  value={pin}
                  readOnly={!!roomCode}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-400 text-center text-lg"
                />
              </div>

              {/* Nickname */}
              <div>
                <label className="block text-sm font-semibold text-green-500 mb-2">
                  Nickname
                </label>

                <input
                  type="text"
                  placeholder="Enter your nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 transition text-white font-semibold py-4 rounded-xl shadow-md hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join Game"}
              </button>
            </form>

            {/* Footer text */}
            <p className="text-gray-400 text-sm text-center mt-8">
              Don’t have a PIN? Ask your host to start a new game
            </p>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="hidden md:flex justify-center relative">
            <div className="w-96 h-96 rounded-full bg-linear-to-r from-pink-400 to-yellow-400 opacity-30 blur-3xl absolute -top-10 -right-10"></div>
            {/* Phone */}
            <div className="relative mt-28">
              <div className="w-56 h-110 rounded-[45px] border-4 border-white/40 bg-white/20 backdrop-blur-md shadow-2xl flex flex-col items-center py-8">
                {/* Top notch */}
                <div className="w-20 h-2 bg-white/50 rounded-full mb-8"></div>

                {/* Screen */}
                <div className="bg-pink-300 w-40 h-72 rounded-3xl p-5 shadow-inner">
                  {/* Avatar */}
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white text-xl">
                      🎮
                    </div>

                    <div className="w-20 h-3 bg-gray-200 rounded-full mt-4"></div>
                    <div className="w-14 h-3 bg-gray-100 rounded-full mt-2"></div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl h-16 flex items-center justify-center text-2xl shadow">
                      ⭐
                    </div>

                    <div className="bg-white rounded-xl h-16 flex items-center justify-center text-2xl shadow">
                      🔥
                    </div>

                    <div className="bg-white rounded-xl h-16 flex items-center justify-center text-2xl shadow">
                      ⚡
                    </div>

                    <div className="bg-white rounded-xl h-16 flex items-center justify-center text-2xl shadow">
                      ❤️
                    </div>
                  </div>
                </div>

                {/* Bottom line */}
                <div className="w-24 h-2 bg-white/40 rounded-full mt-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
