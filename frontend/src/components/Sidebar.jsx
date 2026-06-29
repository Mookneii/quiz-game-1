import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const isMyQuizzes = location.pathname === '/' || location.pathname === '/host';
  const isCreateQuiz = location.pathname === '/create-quiz';

  return (
    <>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col justify-between
          bg-[#eef2f7] border-r w-[260px]
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:flex
        `}
      >
        <div>
          {/* LOGO */}
          <div className="px-6 py-6 flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
              title="Go to Home"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                Q
              </div>
              <h1 className="text-2xl font-bold text-gray-800">QuizUp</h1>
            </button>

            {/* CLOSE BUTTON (mobile) */}
            <button
              className="ml-auto text-gray-500 hover:text-gray-800 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* MENU */}
          <div className="px-3 space-y-2">
            <button
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold shadow-sm text-sm transition ${isMyQuizzes ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-white'}`}
              onClick={() => {
                setSidebarOpen(false);
                navigate("/host");
              }}
              title="Go to Home"
            >
              📚 My Quizzes
            </button>

            <button
              onClick={() => {
                navigate("/create-quiz");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold shadow-sm text-sm transition ${isCreateQuiz ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-white'}`}
            >
              ➕ Create Quiz
            </button>
            
            <button
              onClick={() => {
                navigate("/game-history");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-semibold shadow-sm text-sm transition ${location.pathname.startsWith('/game-history') ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-white'}`}
            >
              📊 Game History
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="text-purple-400 flex items-center w-full gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm font-semibold"
          >
            ↩ Logout
          </button>
        </div>
      </div>
    </>
  );
}
