import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  // SIDEBAR
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // VIEW QUIZ STATE
  const [viewingQuiz, setViewingQuiz] = useState(null);

  // ACTIVE MENU
  const [activeMenu, setActiveMenu] = useState("my-quizzes");

  // ACTIVE DROPDOWN CONTEXT MENU FOR INDIVIDUAL CARD
  const [activeDropdownId, setActiveDropdownId] = useState(null);

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

    // Listen for custom save event to auto-refresh data if arriving back from Edit page
    const handleRefresh = () => fetchQuizzes();
    window.addEventListener("quizSaved", handleRefresh);
    return () => window.removeEventListener("quizSaved", handleRefresh);
  }, []);

  // FETCH QUIZZES
  const fetchQuizzes = async () => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:8080/api/quizzes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }

      const data = await response.json();
      console.log("Quiz data:", data);
      setQuizzes(data);
    } catch (error) {
      console.error("Fetch error, loading fallback metrics:", error);

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

  // FILTERED QUIZZES
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title?.toLowerCase().includes(search.toLowerCase())
  );

  // REUSABLE ROUTING ROUTINE TO FORWARD QUIZ DATA STABLE STATE TO EDIT PAGE
  const handleNavigateToEdit = (selectedQuiz) => {
    navigate("/edit-quiz", {
      state: {
        quiz: {
          title: selectedQuiz.title || "",
          description: selectedQuiz.description || "",
          cover: selectedQuiz.cover || null,
        },
        editingQuizId: selectedQuiz.id || selectedQuiz._id || null,
        questions: selectedQuiz.questions || [],
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <Sidebar
        activeMenu={activeMenu}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 p-4 md:p-10">
        {/* TOPBAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          {/* TITLE */}
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-800">
              My Quizzes
            </h1>

            <p className="text-gray-500 mt-2">
              Welcome back{" "}
              <span className="font-semibold text-emerald-500">
                {user?.fullName || "User"}
              </span>
            </p>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* SEARCH */}
            <input
              type="text"
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white px-4 sm:px-5 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-400 w-full sm:w-[260px]"
            />

            {/* CREATE */}
            <button
              onClick={() => {
                setActiveMenu("create-quiz");
                navigate("/create-quiz");
              }}
              className="bg-emerald-500 hover:bg-emerald-600 transition text-white px-4 sm:px-6 py-3 rounded-xl font-semibold shadow-md w-full sm:w-auto"
            >
              + Create Quiz
            </button>

            {/* USER AVATAR */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-yellow-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
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
            {/* QUIZ GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {/* QUIZZES */}
              {filteredQuizzes.map((quiz) => {
                const targetId = quiz.id || quiz._id;
                return (
                  <div
                    key={targetId}
                    className="bg-white rounded-3xl p-6 md:p-7 border shadow-sm hover:shadow-xl transition relative"
                  >
                    {/* TOP ACCENT LAYOUT */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl">
                        📚
                      </div>

                      {/* CONTEXT DROPDOWN TRIGGER */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveDropdownId(activeDropdownId === targetId ? null : targetId)}
                          className="text-gray-400 text-xl hover:text-gray-600 px-2 py-1 rounded-lg"
                        >
                          ⋮
                        </button>
                        
                        {activeDropdownId === targetId && (
                          <div className="absolute right-0 mt-1 bg-white border shadow-xl rounded-xl py-1 z-10 min-w-[120px]">
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                handleNavigateToEdit(quiz);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-zinc-100 font-semibold"
                            >
                              Edit Details
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TITLE */}
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      {quiz.title}
                    </h3>

                    {/* INFO */}
                    <div className="flex flex-col gap-2 text-gray-500 text-sm mb-8">
                      <span>
                        📄 {quiz.questionsCount ?? (quiz.questions ? quiz.questions.length : 0)} Questions
                      </span>
                      <span>🏷 {quiz.category || "General"}</span>
                      <span>⏱ {quiz.updatedAt || "Recently"}</span>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setViewingQuiz(quiz)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition"
                      >
                        Open
                      </button>

                      <button
                        onClick={() => navigate(`/host/${targetId}`)}
                        className="flex-1 border border-blue-500 text-blue-500 hover:bg-blue-50 py-3 rounded-xl font-semibold transition"
                      >
                        Host
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* CREATE CARD */}
              <button
                onClick={() => {
                  setActiveMenu("create-quiz");
                  navigate("/create-quiz");
                }}
                className="border-2 border-dashed border-purple-300 rounded-3xl flex flex-col items-center justify-center h-[280px] sm:h-[320px] bg-purple-50/40 hover:bg-purple-100 transition"
              >
                <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center text-4xl text-emerald-500 mb-5">
                  +
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-gray-400">
                  Create New Quiz
                </h3>

                <p className="text-purple-400 mt-2 text-sm">
                  Start from scratch
                </p>
              </button>
            </div>

            {/* EMPTY */}
            {filteredQuizzes.length === 0 && (
              <div className="text-center py-20 col-span-1 sm:col-span-2 lg:col-span-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-4">
                  No quizzes found
                </h2>

                <button
                  onClick={() => {
                    setActiveMenu("create-quiz");
                    navigate("/create-quiz");
                  }}
                  className="bg-emerald-500 text-white px-6 py-3 rounded-xl"
                >
                  Create Quiz
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* VIEW QUIZ MODAL */}
      {viewingQuiz && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* HEADER */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {viewingQuiz.title}
                </h2>
                <p className="text-gray-500 mt-1">
                  {viewingQuiz.questionsCount ?? (viewingQuiz.questions ? viewingQuiz.questions.length : 0)} questions
                </p>
              </div>
              <button
                onClick={() => setViewingQuiz(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* DESCRIPTION */}
            {viewingQuiz.description && (
              <div className="px-6 pt-6 pb-4">
                <p className="text-gray-600">{viewingQuiz.description}</p>
              </div>
            )}

            {/* QUESTIONS */}
            <div className="px-6 pb-6 space-y-6">
              {viewingQuiz.questions && viewingQuiz.questions.length > 0 ? (
                viewingQuiz.questions.map((question, idx) => {
                  let standardAnswers = [];
                  if (Array.isArray(question.answers)) {
                    standardAnswers = question.answers;
                  } else if (Array.isArray(question.choices)) {
                    standardAnswers = question.choices.map(c => c.choiceText || "");
                  }

                  let correctIdx = 0;
                  if (question.correctChoiceIndex !== undefined) correctIdx = question.correctChoiceIndex;
                  else if (question.correct !== undefined) correctIdx = question.correct;

                  return (
                    <div key={idx} className="border rounded-2xl p-4 bg-gray-50">
                      {/* QUESTION NUMBER AND TEXT */}
                      <div className="mb-4">
                        <div className="text-sm font-bold text-gray-500 mb-2">
                          Question {idx + 1}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                          {question.questionText || question.question}
                        </h3>
                      </div>

                      {/* DIFFICULTY BADGE */}
                      <div className="mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                            question.difficulty === "easy"
                              ? "bg-emerald-100 text-emerald-700"
                              : question.difficulty === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {question.difficulty || "easy"}
                        </span>
                      </div>

                      {/* ANSWERS */}
                      <div className="space-y-2">
                        {standardAnswers.map((answer, ansIdx) => (
                          <div
                            key={ansIdx}
                            className={`p-3 rounded-lg text-sm font-semibold ${
                              correctIdx === ansIdx
                                ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-700"
                                : "bg-white border-2 border-gray-200 text-gray-700"
                            }`}
                          >
                            {String.fromCharCode(65 + ansIdx)}. {answer}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No questions in this quiz yet
                </p>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t bg-gray-50 p-6 flex gap-3 justify-end sticky bottom-0">
              <button
                onClick={() => setViewingQuiz(null)}
                className="px-6 py-3 rounded-xl border font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const targetQuiz = viewingQuiz;
                  setViewingQuiz(null);
                  handleNavigateToEdit(targetQuiz);
                }}
                className="px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition"
              >
                Edit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}