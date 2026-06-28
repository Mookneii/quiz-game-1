import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getRoomHistory } from '../api/room';
import { Menu, Calendar, Users, ChevronRight, Hash } from 'lucide-react';

export default function GameHistory() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getRoomHistory();
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

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
            <h2 className="text-xl sm:text-2xl font-black text-gray-800">
              Game History
            </h2>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-4 sm:p-8 flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white border rounded-3xl p-10 text-center shadow-sm">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No History Yet</h3>
              <p className="text-gray-500">Host some games to see your history here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((room) => (
                <div 
                  key={room.roomCode}
                  className="bg-white rounded-3xl p-6 border shadow-sm hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/game-history/${room.roomCode}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Hash size={24} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      room.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-700' : 
                      room.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                    {room.quizTitle}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-semibold mb-6">
                    <span>Code:</span>
                    <span className="text-gray-800 font-bold uppercase tracking-widest">{room.roomCode}</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      {new Date(room.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Users size={16} className="text-gray-400" />
                      {room.totalPlayers} Players
                    </div>
                  </div>

                  <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                    View Details <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
