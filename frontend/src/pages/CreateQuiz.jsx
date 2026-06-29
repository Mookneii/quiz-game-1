import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuiz } from "../api/quiz";
import { ArrowLeft, Menu } from "lucide-react";
import Sidebar from "../components/Sidebar";

export default function CreateQuiz() {
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);


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



  return (
    <div className="h-screen bg-zinc-100 flex relative overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
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
        <div className="bg-[#f5f7fb] border-t lg:border-t-0 lg:border-l p-5 sm:p-6 lg:p-10 flex flex-col justify-center items-center">
          <div className="text-xs uppercase font-bold text-zinc-400 mb-8 self-start">Live Preview</div>

          <div className="w-full max-w-sm bg-white rounded-3xl p-5 sm:p-7 border shadow-sm hover:shadow-xl transition">
            {/* TOP */}
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl">
                📚
              </div>
            </div>

            {/* TITLE */}
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 break-words">
              {quiz.title || "Quiz Title"}
            </h3>

            {/* INFO */}
            <div className="flex flex-col gap-2 text-gray-500 text-sm mb-5 sm:mb-8">
              <span className="break-words">📄 0 Questions</span>
              <span className="break-words">🏷 General</span>
              <span className="break-words">⏱ Just now</span>
              {quiz.description && (
                <span className="break-words mt-2 text-zinc-400 italic">"{quiz.description}"</span>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3">
              <button
                disabled
                className="flex-1 bg-emerald-500 opacity-50 text-white py-2.5 sm:py-3 rounded-xl font-semibold transition text-sm cursor-not-allowed"
              >
                Open
              </button>

              <button
                disabled
                className="flex-1 border border-blue-500 opacity-50 text-blue-500 py-2.5 sm:py-3 rounded-xl font-semibold transition text-sm cursor-not-allowed"
              >
                Host
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}