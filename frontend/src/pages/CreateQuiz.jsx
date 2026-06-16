// ================================================
// CREATE QUIZ PAGE
// ================================================
import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Upload, Eye, Check } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const coverInputRef = useRef(null);

  // Check if we are returning from EditQuiz or editing an existing quiz
  const existingQuiz = location.state?.quiz || null;
  const existingQuestions = location.state?.questions || [];
  const editingQuizId = location.state?.editingQuizId || null;

  const [quiz, setQuiz] = useState({
    title: existingQuiz?.title || "",
    description: existingQuiz?.description || "",
    cover: existingQuiz?.cover || null,
  });

  const [questions] = useState(existingQuestions);

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setQuiz({
      ...quiz,
      cover: URL.createObjectURL(file),
    });
  };

  const goToQuestions = () => {
    // Forward the current quiz settings and questions state to EditQuiz
    navigate("/edit-quiz", {
      state: {
        quiz,
        questions,
        editingQuizId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <Sidebar activeMenu="create-quiz" isOpen={true} onToggle={() => {}} />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* NAVBAR */}
        <div className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
          <button
            onClick={() => navigate("/host")}
            className="w-10 h-10 rounded-xl hover:bg-zinc-100 flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={() => navigate("/host")}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm">
              Q
            </div>
            <span className="font-bold text-gray-800 text-lg hidden sm:inline">
              QuizUp
            </span>
          </button>
          <div />
        </div>

        {/* CONTENT GRID */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] min-h-[calc(100vh-64px)]">
            {/* LEFT - FORM */}
            <div className="p-4 md:p-10">
              <h2 className="text-2xl md:text-4xl font-black">
                {editingQuizId ? "Modify Quiz Info" : "Create Quiz"}
              </h2>

              <div className="space-y-6 mt-8">
                {/* TITLE */}
                <div>
                  <label className="text-sm font-bold">Quiz Title</label>
                  <input
                    className="w-full border rounded-2xl px-4 py-3 mt-2"
                    placeholder="Quiz title..."
                    value={quiz.title}
                    onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                  />
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="text-sm font-bold">Description</label>
                  <textarea
                    className="w-full border rounded-2xl px-4 py-3 mt-2 h-32"
                    placeholder="Quiz description..."
                    value={quiz.description}
                    onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
                  />
                </div>

                {/* COVER IMAGE */}
                <div>
                  <label className="text-sm font-bold">Cover Image</label>
                  <div className="mt-3 border-2 border-dashed rounded-3xl p-8 bg-white text-center">
                    <input
                      hidden
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                    />
                    <button
                      onClick={() => coverInputRef.current.click()}
                      className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto"
                    >
                      <Upload size={18} />
                      Choose Cover
                    </button>
                    <p className="text-sm text-zinc-500 mt-4">Upload cover image</p>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-3">
                  <button
                    onClick={goToQuestions}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold"
                  >
                    Edit / Add Questions
                  </button>
                  <button className="bg-white border px-6 py-3 rounded-2xl font-bold flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <Eye size={18} />
                    Preview
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT - LIVE PREVIEW */}
            <div className="bg-white border-l p-4 md:p-6 border-t md:border-t-0 hidden md:flex md:flex-col overflow-hidden">
              <div className="text-xs uppercase font-bold text-zinc-400 mb-4">
                Live Preview
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto flex-1">
                {/* QUIZ CARD */}
                <div className="border rounded-3xl overflow-hidden flex-shrink-0">
                  <div
                    className={`h-36 bg-cover bg-center ${
                      !quiz.cover ? "bg-gradient-to-r from-indigo-500 to-emerald-500" : ""
                    }`}
                    style={{
                      backgroundImage: quiz.cover ? `url(${quiz.cover})` : "none",
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-black text-lg">{quiz.title || "Quiz Title"}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {quiz.description || "Quiz description preview"}
                    </p>
                    <div className="mt-3">
                      <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold">
                        {questions.length} Questions
                      </span>
                    </div>
                  </div>
                </div>

                {/* LIVE QUESTIONS LIST */}
                {questions.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-400 uppercase">Questions</div>
                    {questions.map((q, idx) => (
                      <div key={idx} className="border rounded-2xl p-3 bg-zinc-50">
                        <div className="font-bold text-sm mb-2">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="space-y-1">
                          {q.answers.map((ans, i) => (
                            <div
                              key={i}
                              className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                                q.correct === i ? "bg-emerald-100 border border-emerald-300" : "bg-white border"
                              }`}
                            >
                              {q.correct === i && <Check size={14} />}
                              <span className={q.correct === i ? "text-emerald-700 font-bold" : ""}>
                                {String.fromCharCode(65 + i)}. {ans}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}