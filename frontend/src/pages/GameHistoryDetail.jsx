import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getGameResults } from '../api/game';
import { Menu, ArrowLeft, Trophy, Target } from 'lucide-react';

export default function GameHistoryDetail() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await getGameResults(roomCode);
        setResults(res.data);
      } catch (err) {
        console.error("Failed to fetch game results", err);
      } finally {
        setLoading(false);
      }
    };
    if (roomCode) {
      fetchDetails();
    }
  }, [roomCode]);

  return (
    <div className="min-h-screen bg-[#eef2f7] flex relative">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* HEADER */}
        <div className="h-16 sm:h-20 bg-white border-b flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-gray-700 shadow-sm hover:bg-gray-50 transition"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => navigate('/game-history')}
              className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 uppercase tracking-wide">
              ROOM: {roomCode}
            </h2>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-8 flex-1 max-w-5xl mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white border rounded-3xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">🤷</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Records Found</h3>
              <p className="text-gray-500">There are no student records for this game.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
              <div className="px-6 py-5 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">Student Results</h3>
                <span className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full text-sm">
                  {results.length} Players
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">Rank</th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm">Nickname</th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm text-right">Correct Answers</th>
                      <th className="px-6 py-4 font-bold text-gray-500 text-sm text-right">Total Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .map((player, index) => (
                      <tr key={player.playerId} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-bold text-gray-700">
                            {index === 0 ? <span className="text-yellow-500 text-xl">🥇</span> : 
                             index === 1 ? <span className="text-gray-400 text-xl">🥈</span> :
                             index === 2 ? <span className="text-amber-600 text-xl">🥉</span> :
                             <span className="text-gray-400 w-6 text-center">{index + 1}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800 text-lg">{player.nickname}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-xl font-bold">
                            <Target size={16} />
                            {player.correctCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl font-black text-lg">
                            <Trophy size={18} />
                            {player.totalScore}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
