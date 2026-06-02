import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

export default function HostDashboard() {
  const navigate = useNavigate();

  // USER
  const [user, setUser] =
    useState(null);

  // QUIZZES
  const [quizzes, setQuizzes] =
    useState([]);

  // LOADING
  const [loading, setLoading] =
    useState(true);

  // SEARCH
  const [search, setSearch] =
    useState("");

  // TOKEN
  const token =
    localStorage.getItem("token");

  // CHECK LOGIN
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // GET USER
    const storedUser =
      localStorage.getItem("user");

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
        "http://localhost:8080/api/quizzes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch quizzes"
        );
      }

      const data =
        await response.json();

      console.log(
        "Quiz data:",
        data
      );

      setQuizzes(data);
    } catch (error) {
      console.log(error);

      // TEMP DATA IF API FAILS
      setQuizzes([
        {
          id: 1,
          title:
            "Modern Physics & Space",
          questionsCount: 25,
          updatedAt: "2 days ago",
          category: "Science",
        },

        {
          id: 2,
          title:
            "Future of AI & ML",
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
      const response = await fetch("http://localhost:8080/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId: quizId,
          hostId: user?.id,
          hostName: user?.fullName || "Host",
        }),
      });

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
  const filteredQuizzes =
    quizzes.filter((quiz) =>
      quiz.title
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      {/* SIDEBAR */}
      <div className="w-[260px] bg-[#eef2f7] border-r flex flex-col justify-between">
        <div>
          {/* LOGO */}
          <div className="px-8 py-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white font-bold text-lg">
              ⚡
            </div>

            <h1 className="text-3xl font-bold text-gray-800">
              QuizUp
            </h1>
          </div>

          {/* MENU */}
          <div className="px-3 space-y-2">
            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-500 text-white font-semibold shadow-md">
              📚 My Quizzes
            </button>

            <button
              onClick={() =>
                navigate("/create-quiz")
              }
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-700 hover:bg-white transition"
            >
              ➕ Create Quiz
            </button>

            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-700 hover:bg-white transition">
              📈 Reports
            </button>

            <button className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-gray-700 hover:bg-white transition">
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* LOGOUT */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="text-purple-400 flex items-center gap-3 px-4 py-3 hover:text-red-500 transition"
          >
            ↩ Logout
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 p-10">
        {/* TOPBAR */}
        <div className="flex items-center justify-between mb-10">
          {/* TITLE */}
          <div>
            <h1 className="text-5xl font-bold text-gray-800">
              My Quizzes
            </h1>

            <p className="text-gray-500 mt-2">
              Welcome back{" "}
              <span className="font-semibold text-emerald-500">
                {user?.fullName ||
                  "User"}
              </span>
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-5">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="bg-white px-5 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-400 w-[260px]"
            />

            {/* CREATE */}
            <button
              onClick={() =>
                navigate("/create-quiz")
              }
              className="bg-emerald-500 hover:bg-emerald-600 transition text-white px-6 py-3 rounded-xl font-semibold shadow-md"
            >
              + Create Quiz
            </button>

            {/* USER AVATAR */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 flex items-center justify-center text-white font-bold text-lg">
              {user?.fullName
                ?.charAt(0)
                .toUpperCase() || "U"}
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
            {/* QUIZ GRID */}
            <div className="grid grid-cols-3 gap-8">
              {/* QUIZZES */}
              {filteredQuizzes.map(
                (quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-3xl p-7 border shadow-sm hover:shadow-xl transition"
                  >
                    {/* TOP */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl">
                        📚
                      </div>

                      <button className="text-gray-400 text-xl">
                        ⋮
                      </button>
                    </div>

                    {/* TITLE */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      {quiz.title}
                    </h3>

                    {/* INFO */}
                    <div className="flex flex-col gap-2 text-gray-500 text-sm mb-8">
                      <span>
                        📄{" "}
                        {quiz.questionsCount ||
                          0}{" "}
                        Questions
                      </span>

                      <span>
                        🏷{" "}
                        {quiz.category ||
                          "General"}
                      </span>

                      <span>
                        ⏱{" "}
                        {quiz.updatedAt ||
                          "Recently"}
                      </span>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          navigate(
                            `/create-quiz/${quiz.id}`
                          )
                        }
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition"
                      >
                        Open
                      </button>

                      <button
                        onClick={() => handleHostRoom(quiz.id)}
                        className="flex-1 border border-blue-500 text-blue-500 hover:bg-blue-50 py-3 rounded-xl font-semibold transition"
                      >
                        Host
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* CREATE CARD */}
              <button
                onClick={() =>
                  navigate("/create-quiz")
                }
                className="border-2 border-dashed border-purple-300 rounded-3xl flex flex-col items-center justify-center h-[320px] bg-purple-50/40 hover:bg-purple-100 transition"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center text-4xl text-emerald-500 mb-5">
                  +
                </div>

                <h3 className="text-2xl font-bold text-gray-400">
                  Create New Quiz
                </h3>

                <p className="text-purple-400 mt-2">
                  Start from scratch
                </p>
              </button>
            </div>

            {/* EMPTY */}
            {filteredQuizzes.length ===
              0 && (
              <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-gray-700 mb-4">
                  No quizzes found
                </h2>

                <button
                  onClick={() =>
                    navigate(
                      "/create-quiz"
                    )
                  }
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl"
                >
                  Create Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}