import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { MoreVertical, Pen, Trash } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function HostDashboard() {
  const navigate = useNavigate();

  // USER
  const [user, setUser] = useState(null);

  // QUIZZES
  const [quizzes, setQuizzes] = useState([]);

  // LOADING
  const [loading, setLoading] = useState(true);

  // SEARCH
  const [search, setSearch] = useState("");

  // SIDEBAR OPEN (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // DROPDOWN MENU
  const [openDropdown, setOpenDropdown] = useState(null);

  // DELETE MODAL
  const [deleteQuizId, setDeleteQuizId] = useState(null);

  // TOKEN
  const token = localStorage.getItem("token");

  // CHECK LOGIN
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // GET USER
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetchQuizzes();
  }, []);

  // FETCH QUIZZES
  const fetchQuizzes = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `https://quizgame-backend-production-5fa0.up.railway.app/api/quizzes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      const data = await response.json();

      console.log("Quiz data:", data);

      setQuizzes(data);
    } catch (error) {
      console.log(error);

      // TEMP DATA IF API FAILS
      setQuizzes([
        {
          id: 1,
          title: "Modern Physics & Space",
          questionsCount: 25,
          updatedAt: "2 days ago",
          category: "Science",
        },

        {
          id: 2,
          title: "Future of AI & ML",
          questionsCount: 30,
          updatedAt: "1 week ago",
          category: "Technology",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // LOGOUT
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // HOST ROOM
  const handleHostRoom = async (quizId) => {
    try {
      const response = await fetch(
        `https://quizgame-backend-production-5fa0.up.railway.app/api/rooms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quizId: quizId,
            hostId: user?.id,
            hostName: user?.fullName || "Host",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      console.log("Room created:", data);

      navigate(`/lobby-host/${data.roomCode}`, {
        state: {
          pin: data.roomCode,
          hostId: user?.id,
          hostName: user?.fullName,
        },
      });
    } catch (err) {
      alert("Error starting game: " + err.message);
    }
  };

  // FILTERED QUIZZES
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#f5f7fb] flex relative overflow-hidden">

      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* MAIN */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto h-full">

        {/* TOPBAR */}
        <div className="mb-6 lg:mb-10">

          {/* ROW 1: hamburger + title + welcome */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* HAMBURGER (mobile) */}
            <button
              className="lg:hidden flex-shrink-0 w-9 h-9 rounded-xl bg-white border flex items-center justify-center text-gray-700 shadow-sm hover:bg-gray-50 transition"
              onClick={() => setSidebarOpen(true)}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-800 leading-tight">
                My Quizzes
              </h1>
              <p className="text-gray-500 mt-1 text-sm sm:text-base">
                Welcome back{" "}
                <span className="font-semibold text-emerald-500">
                  {user?.fullName || "User"}
                </span>
              </p>
            </div>
          </div>

          {/* ROW 2: search + create + avatar — always one line */}
          <div className="flex items-center gap-2 sm:gap-3 mt-4">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white px-4 py-2.5 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-400 text-sm flex-1 sm:flex-none sm:w-[200px] lg:w-[260px]"
            />

            {/* CREATE */}
            <button
              onClick={() => navigate("/create-quiz")}
              className="bg-emerald-500 hover:bg-emerald-600 transition text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold shadow-md text-sm whitespace-nowrap"
            >
              + Create
            </button>

            {/* USER AVATAR */}
            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 flex items-center justify-center text-white font-bold text-base">
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="text-center py-20 text-xl text-gray-500">
            Loading quizzes...
          </div>
        ) : (
          <>
            {/* QUIZ GRID — 1 col on mobile, 2 on md, 3 on xl */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* QUIZZES */}
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl p-5 sm:p-7 border shadow-sm hover:shadow-xl transition"
                >
                  {/* TOP */}
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl">
                      📚
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdown(openDropdown === quiz.id ? null : quiz.id)}
                        className="text-gray-400 hover:bg-gray-50 p-2 rounded-lg transition"
                        title="Options"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {/* DROPDOWN */}
                      {openDropdown === quiz.id && (
                        <div className="absolute right-0 mt-1 w-36 bg-white border rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                          <button
                            onClick={() => {
                              navigate(`/edit-quiz/${quiz.id}`);
                              setOpenDropdown(null);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700 transition"
                          >
                            <Pen size={16} /> Edit
                          </button>
                          <button
                            onClick={() => {
                              setOpenDropdown(null);
                              setDeleteQuizId(quiz.id);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-sm text-red-500 transition"
                          >
                            <Trash size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TITLE */}
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3">
                    {quiz.title}
                  </h3>

                  {/* INFO */}
                  <div className="flex flex-col gap-2 text-gray-500 text-sm mb-5 sm:mb-8">
                    <span>📄 {quiz.questionsCount || 0} Questions</span>
                    <span>🏷 {quiz.category || "General"}</span>
                    <span>⏱ {quiz.updatedAt || "Recently"}</span>
                    {quiz.description && (
                      <span className="break-words mt-2 text-zinc-400 italic">"{quiz.description}"</span>
                    )}
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 sm:py-3 rounded-xl font-semibold transition text-sm"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => handleHostRoom(quiz.id)}
                      className="flex-1 border border-blue-500 text-blue-500 hover:bg-blue-50 py-2.5 sm:py-3 rounded-xl font-semibold transition text-sm"
                    >
                      Host
                    </button>
                  </div>
                </div>
              ))}

              {/* CREATE CARD */}
              <button
                onClick={() => navigate("/create-quiz")}
                className="border-2 border-dashed border-purple-300 rounded-3xl flex flex-col items-center justify-center h-[240px] sm:h-[320px] bg-purple-50/40 hover:bg-purple-100 transition"
              >
                <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-4xl text-emerald-500 mb-4">
                  +
                </div>

                <h3 className="text-lg sm:text-2xl font-bold text-gray-400">
                  Create New Quiz
                </h3>

                <p className="text-purple-400 mt-2 text-sm">
                  Start from scratch
                </p>
              </button>
            </div>

            {/* EMPTY */}
            {filteredQuizzes.length === 0 && (
              <div className="text-center py-20">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-4">
                  No quizzes found
                </h2>

                <button
                  onClick={() => navigate("/create-quiz")}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-semibold"
                >
                  Create Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* DELETE MODAL */}
      {deleteQuizId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-[90%] max-w-[420px] rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h2 className="text-2xl font-black">
              Delete Quiz
            </h2>
            <p className="text-zinc-500 mt-3">
              Are you sure you want to delete this quiz? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setDeleteQuizId(null)}
                className="border px-5 py-3 rounded-2xl font-bold hover:bg-zinc-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const { deleteQuiz } = await import("../api/quiz");
                    await deleteQuiz(deleteQuizId);
                    setDeleteQuizId(null);
                    fetchQuizzes();
                  } catch (err) {
                    alert("Failed to delete quiz");
                  }
                }}
                className="bg-red-500 text-white px-5 py-3 rounded-2xl font-bold hover:bg-red-600 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}