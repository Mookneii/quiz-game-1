// ================================================
// FULLY FIXED QUIZ BUILDER
// ================================================

import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { generateQuizFromDocument, createQuiz, getQuiz } from "../api/quiz";

import {
  ArrowLeft,
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Settings2,
  Upload,
  Check,
  Eye,
} from "lucide-react";

export default function CreateQuiz() {
  const navigate = useNavigate();
  
  const coverInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    cover: null,
  });

  const [showPreview, setShowPreview] =
    useState(false);

  // ========================================
  // COVER IMAGE
  // ========================================

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setQuiz({
      ...quiz,
      cover: URL.createObjectURL(file),
    });
  };

  // ========================================
  // CREATE QUIZ
  // ========================================

  const handleCreateQuiz = async () => {
    try {
      if (!quiz.title.trim()) {
        alert("Please enter a quiz title.");
        return;
      }
      
      const response = await createQuiz({
        id: null,
        title: quiz.title,
        description: quiz.description || "",
        questions: []
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
    <div className="min-h-screen bg-zinc-100">
      {/* NAVBAR */}

      <div className="h-16 bg-white border-b flex items-center justify-between px-6">
        <button
          onClick={() => navigate("/host")}
          className="w-10 h-10 rounded-xl hover:bg-zinc-100 flex items-center justify-center"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-xl font-black text-emerald-500">
          QuizUp
        </h1>

        <div />
      </div>

      {/* CREATE PAGE */}
      
      <div className="grid grid-cols-[1fr_320px]">
          {/* LEFT */}

          <div className="p-10">
            <h2 className="text-4xl font-black">
              Create Quiz
            </h2>

            <div className="space-y-6 mt-8">
              {/* TITLE */}

              <div>
                <label className="text-sm font-bold">
                  Quiz Title
                </label>

                <input
                  className="w-full border rounded-2xl px-4 py-3 mt-2"
                  placeholder="Quiz title..."
                  value={quiz.title}
                  onChange={(e) =>
                    setQuiz({
                      ...quiz,
                      title: e.target.value,
                    })
                  }
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="text-sm font-bold">
                  Description
                </label>

                <textarea
                  className="w-full border rounded-2xl px-4 py-3 mt-2 h-32"
                  placeholder="Quiz description..."
                  value={quiz.description}
                  onChange={(e) =>
                    setQuiz({
                      ...quiz,
                      description:
                        e.target.value,
                    })
                  }
                />
              </div>

              {/* COVER */}

              <div>
                <label className="text-sm font-bold">
                  Cover Image
                </label>

                <div className="mt-3 border-2 border-dashed rounded-3xl p-8 bg-white text-center">
                  <input
                    hidden
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                  />

                  <button
                    onClick={() =>
                      coverInputRef.current.click()
                    }
                    className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto"
                  >
                    <Upload size={18} />
                    Choose Cover
                  </button>

                  <p className="text-sm text-zinc-500 mt-4">
                    Upload cover image
                  </p>
                </div>
              </div>

              {/* ACTION */}

                <button
                  onClick={handleCreateQuiz}
                  className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold"
                >
                  Create & Add Questions
                </button>

                <button
                  onClick={() =>
                    setShowPreview(true)
                  }
                  className="bg-white border px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                >
                  <Eye size={18} />
                  Preview
                </button>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW */}

          <div className="bg-white border-l p-6">
            <div className="text-xs uppercase font-bold text-zinc-400">
              Live Preview
            </div>

            <div className="mt-4 border rounded-3xl overflow-hidden">
              <div
                className={`h-44 bg-cover bg-center ${
                  !quiz.cover
                    ? "bg-gradient-to-r from-indigo-500 to-emerald-500"
                    : ""
                }`}
                style={{
                  backgroundImage: quiz.cover
                    ? `url(${quiz.cover})`
                    : "none",
                }}
              />

              <div className="p-5">
                <h3 className="font-black text-2xl">
                  {quiz.title || "Quiz Title"}
                </h3>

                <p className="text-sm text-zinc-500 mt-2">
                  {quiz.description ||
                    "Quiz description preview"}
                </p>

                <div className="mt-5">
                  <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold">
                    New Quiz
                  </span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}