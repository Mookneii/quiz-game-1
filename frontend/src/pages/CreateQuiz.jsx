import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../api/quiz";
import { ArrowLeft, Upload, Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function CreateQuiz() {
  const navigate = useNavigate();
  const coverInputRef = useRef(null);

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    cover: null,
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQuiz({ ...quiz, cover: URL.createObjectURL(file) });
  };

  const handleCreateQuiz = async () => {
    try {
      if (!quiz.title.trim()) {
        alert("Please enter a quiz title.");
        return;
      }

      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        alert("Please log in to create a quiz.");
        return;
      }

      const response = await createQuiz({
        id: null,
        title: quiz.title,
        description: quiz.description || "",
        creatorId: user.id,
        questions: [],
      });
      if (response.data && response.data.id) {
        navigate(`/edit-quiz/${response.data.id}`);
      } else {
        alert("Failed to create quiz (no ID returned).");
      }
    } catch (err) {
      alert("Error creating quiz: " + err.message);
    }
  };

  const coverBg = quiz.cover
    ? "bg-cover bg-center"
    : "bg-gradient-to-r from-indigo-500 to-emerald-500";

  return (
    <div className="min-h-screen bg-zinc-100 flex relative overflow-x-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <div className="h-14 sm:h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border flex items-center justify-center text-gray-700 shadow-sm hover:bg-gray-50 transition"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <button
              onClick={() => navigate("/host")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-zinc-100 flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-emerald-500">QuizUp</h1>
          <div />
        </div>

      {/* CONTENT — stacks on mobile, side-by-side on lg+ */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px]">

        {/* LEFT: form */}
        <div className="p-5 sm:p-8 lg:p-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black">Create Quiz</h2>

          <div className="space-y-5 mt-6 sm:mt-8">
            {/* TITLE */}
            <div>
              <label className="text-sm font-bold">Quiz Title</label>
              <input
                className="w-full border rounded-2xl px-4 py-3 mt-2 text-sm sm:text-base outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Quiz title..."
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-sm font-bold">Description</label>
              <textarea
                className="w-full border rounded-2xl px-4 py-3 mt-2 h-28 sm:h-32 text-sm sm:text-base outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                placeholder="Quiz description..."
                value={quiz.description}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              />
            </div>

            {/* COVER IMAGE */}
            <div>
              <label className="text-sm font-bold">Cover Image</label>
              <div className="mt-3 border-2 border-dashed rounded-3xl p-6 sm:p-8 bg-white text-center">
                <input
                  hidden
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                />
                <button
                  onClick={() => coverInputRef.current.click()}
                  className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto text-sm sm:text-base hover:bg-emerald-600 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm hover:shadow"
                >
                  <Upload size={18} />
                  Choose Cover
                </button>
                <p className="text-xs sm:text-sm text-zinc-500 mt-3">
                  Upload cover image
                </p>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              onClick={handleCreateQuiz}
              className="w-full sm:w-auto bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold text-sm sm:text-base hover:bg-zinc-800 transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-md hover:shadow-lg"
            >
              Create &amp; Add Questions
            </button>
          </div>
        </div>

        {/* RIGHT: live preview — shown below form on mobile, beside on desktop */}
        <div className="bg-white border-t lg:border-t-0 lg:border-l p-5 sm:p-6">
          <div className="text-xs uppercase font-bold text-zinc-400">Live Preview</div>

          <div className="mt-4 border rounded-3xl overflow-hidden">
            <div
              className={`h-36 sm:h-44 ${coverBg}`}
              style={{
                backgroundImage: quiz.cover ? `url(${quiz.cover})` : "none",
              }}
            />

            <div className="p-4 sm:p-5">
              <h3 className="font-black text-xl sm:text-2xl break-words">
                {quiz.title || "Quiz Title"}
              </h3>
              <p className="text-sm text-zinc-500 mt-2 break-words">
                {quiz.description || "Quiz description preview"}
              </p>
              <div className="mt-4">
                <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold">
                  New Quiz
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}