// ================================================
// FULLY FIXED QUIZ BUILDER
// ================================================

import React, { useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

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

import Sidebar from "../components/Sidebar";

// AI ENDPOINT CONFIGURATION
const LOCAL_AI_URL = "http://localhost:11434/api/generate";

export default function QuizBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const coverInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  const [page, setPage] = useState("create");
  const [isSaving, setIsSaving] =
    useState(false);

  const editQuiz = location.state?.editQuiz || null;

  const [quiz, setQuiz] = useState({
    title: editQuiz?.title || "",
    description: editQuiz?.description || "",
    cover: null,
  });

  const [questions, setQuestions] = useState(editQuiz?.questions || []);
  const [editingQuizId, setEditingQuizId] = useState(editQuiz?.id || null);

  const [showAddPanel, setShowAddPanel] =
    useState(false);

  const [showPreview, setShowPreview] =
    useState(false);

  const [isGeneratingAI, setIsGeneratingAI] =
    useState(false);

  const [activeSettingIndex, setActiveSettingIndex] =
    useState(null);

  const [editingQuestion, setEditingQuestion] =
    useState(null);

  const [deleteIndex, setDeleteIndex] =
    useState(null);

  const [newQuestion, setNewQuestion] =
    useState({
      question: "",
      answers: ["", "", "", ""],
      correct: null,
      difficulty: "easy",
    });

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
  // AI GENERATE WITH REAL ENDPOINT
  // ========================================

  const handleAIImport = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setIsGeneratingAI(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(LOCAL_AI_URL, {
        method: method,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `AI endpoint error: ${response.status}`
        );
      }

      const data = await response.json();
      const generatedQuestions = Array.isArray(data)
        ? data
        : data.questions || [];

      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length === 0
      ) {
        throw new Error(
          "Invalid response format from AI endpoint"
        );
      }

      setQuestions((prev) => [
        ...prev,
        ...generatedQuestions,
      ]);
    } catch (error) {
      console.error(
        "Error generating questions:",
        error
      );
      alert(
        `Failed to generate questions: ${error.message}. Make sure the local AI endpoint is running at ${LOCAL_AI_URL}`
      );
    } finally {
      setIsGeneratingAI(false);
      e.target.value = "";
    }
  };

  // ========================================
  // SAVE QUESTION
  // ========================================

  const saveQuestion = () => {
    if (!newQuestion.question.trim()) {
      alert("Please input question");
      return;
    }

    if (
      newQuestion.answers.some(
        (a) => a.trim() === ""
      )
    ) {
      alert("Please fill all answers");
      return;
    }

    if (newQuestion.correct === null) {
      alert("Please select correct answer");
      return;
    }

    setQuestions((prev) => [
      ...prev,
      {
        ...newQuestion,
        answers: [...newQuestion.answers],
      },
    ]);

    setNewQuestion({
      question: "",
      answers: ["", "", "", ""],
      correct: null,
      difficulty: "easy",
    });

    setShowAddPanel(false);
  };

  // ========================================
  // DELETE QUESTION
  // ========================================

  const deleteQuestion = () => {
    const updated = questions.filter(
      (_, i) => i !== deleteIndex
    );

    setQuestions(updated);

    setDeleteIndex(null);
  };

  // ========================================
  // SAVE EDIT
  // ========================================

  const saveEdit = () => {
    if (!editingQuestion.data.question.trim()) {
      alert("Question required");
      return;
    }

    if (
      editingQuestion.data.answers.some(
        (a) => a.trim() === ""
      )
    ) {
      alert("All answers required");
      return;
    }

    const updated = [...questions];

    updated[editingQuestion.index] = {
      ...editingQuestion.data,
      answers: [...editingQuestion.data.answers],
    };

    setQuestions(updated);

    setEditingQuestion(null);
  };

  // ========================================
  // SAVE QUIZ TO API
  // ========================================

  const saveDone = async () => {
    if (!quiz.title.trim()) {
      alert("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token) {
        alert("Please login again.");
        return;
      }

      const quizData = {
        title: quiz.title,
        description: quiz.description,
        creatorId: user.id,
        questions: questions.map((q) => ({
          questionText: q.question,
          difficulty: q.difficulty,
          timeLimit: 30,
          correctChoiceIndex: q.correct,
          choices: q.answers.map((ans, i) => ({
            choiceText: ans,
            isCorrect: i === q.correct,
          })),
        })),
      };

      const url = editingQuizId
        ? `http://localhost:8080/api/quizzes/${editingQuizId}`
        : "http://localhost:8080/api/quizzes";
      const method = editingQuizId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizData),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error("Failed to save quiz: " + err);
      }

      window.dispatchEvent(new Event("quizSaved"));
      navigate("/host");
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <Sidebar 
        activeMenu="create-quiz"
        isOpen={true}
        onToggle={() => {}}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* NAVBAR */}

        <div className="h-16 bg-white border-b flex items-center justify-between px-4 md:px-6">
          <button
            onClick={() =>
              page === "create" 
                ? navigate("/host")
                : setPage("create")
            }
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

        {/* QUIZ BUILDER CONTENT */}
        <div className="flex-1 overflow-y-auto">

      {page === "create" && (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] min-h-[calc(100vh-64px)]">
          {/* LEFT */}

          <div className="p-4 md:p-10">
            <h2 className="text-2xl md:text-4xl font-black">
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

              <div className="flex gap-3">
                <button
                  onClick={() => setPage("edit")}
                  className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold"
                >
                  Edit / Add Questions
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

          <div className="bg-white border-l p-4 md:p-6 border-t md:border-t-0 hidden md:flex md:flex-col overflow-hidden">
            <div className="text-xs uppercase font-bold text-zinc-400 mb-4">
              Live Preview
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto flex-1">
              {/* QUIZ CARD */}
              <div className="border rounded-3xl overflow-hidden flex-shrink-0">
                <div
                  className={`h-36 bg-cover bg-center ${
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

                <div className="p-4">
                  <h3 className="font-black text-lg">
                    {quiz.title || "Quiz Title"}
                  </h3>

                  <p className="text-xs text-zinc-500 mt-1">
                    {quiz.description ||
                      "Quiz description preview"}
                  </p>

                  <div className="mt-3">
                    <span className="bg-zinc-100 px-3 py-1 rounded-full text-xs font-bold">
                      {questions.length} Questions
                    </span>
                  </div>
                </div>
              </div>

              {/* QUESTIONS LIST */}
              {questions.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase">
                    Questions
                  </div>

                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="border rounded-2xl p-3 bg-zinc-50"
                    >
                      <div className="font-bold text-sm mb-2">
                        {idx + 1}. {q.question}
                      </div>

                      <div className="mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize inline-block ${
                            q.difficulty === "easy"
                              ? "bg-emerald-100 text-emerald-700"
                              : q.difficulty ===
                                "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {q.answers.map(
                          (ans, i) => (
                            <div
                              key={i}
                              className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                                q.correct === i
                                  ? "bg-emerald-100 border border-emerald-300"
                                  : "bg-white border"
                              }`}
                            >
                              {q.correct ===
                                i && (
                                <Check size={14} />
                              )}
                              <span
                                className={
                                  q.correct ===
                                  i
                                    ? "text-emerald-700 font-bold"
                                    : ""
                                }
                              >
                                {String.fromCharCode(
                                  65 + i
                                )}
                                . {ans}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT PAGE */}

      {page === "edit" && (
        <div className="p-4 md:p-10">
          {/* HEADER */}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl md:text-4xl font-black">
                Edit / Add Questions
              </h2>

              <p className="text-zinc-500 mt-2">
                Manage your quiz questions
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* DONE */}

              <button
                onClick={saveDone}
                disabled={isSaving}
                className={`text-white px-5 py-3 rounded-2xl font-bold flex-1 md:flex-none transition ${
                  isSaving
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isSaving ? "Saving..." : "Done"}
              </button>

              {/* AI */}

              <input
                hidden
                type="file"
                ref={aiFileInputRef}
                onChange={handleAIImport}
              />

              <button
                disabled={isGeneratingAI}
                onClick={() =>
                  aiFileInputRef.current.click()
                }
                className={`px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-white flex-1 md:flex-none ${
                  isGeneratingAI
                    ? "bg-emerald-300 cursor-not-allowed"
                    : "bg-emerald-500"
                }`}
              >
                <Sparkles size={18} />

                {isGeneratingAI
                  ? "Generating..."
                  : "AI Generate"}
              </button>

              {/* ADD */}

              <button
                onClick={() =>
                  setShowAddPanel(true)
                }
                className="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 flex-1 md:flex-none"
              >
                <Plus size={18} />
                Add Question
              </button>
            </div>
          </div>

          {/* QUESTIONS */}

          <div className="mt-10 space-y-4">
            {questions.map((q, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl border p-6"
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="font-black text-lg">
                      {index + 1}. {q.question}
                    </div>

                    <div className="mt-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                          q.difficulty === "easy"
                            ? "bg-emerald-100 text-emerald-700"
                            : q.difficulty ===
                              "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      {q.answers.map((ans, i) => (
                        <div
                          key={i}
                          className={`border rounded-2xl p-3 flex items-center gap-2 ${
                            q.correct === i
                              ? "bg-emerald-50 border-emerald-400"
                              : ""
                          }`}
                        >
                          {q.correct === i && (
                            <Check size={16} />
                          )}

                          {ans}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SETTINGS */}

                  <div className="relative ml-4">
                    <button
                      onClick={() =>
                        setActiveSettingIndex(
                          activeSettingIndex ===
                            index
                            ? null
                            : index
                        )
                      }
                      className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center"
                    >
                      <Settings2 size={18} />
                    </button>

                    {activeSettingIndex ===
                      index && (
                      <div className="absolute right-0 mt-2 bg-white border shadow-xl rounded-2xl p-2 flex gap-2 z-20">
                        {/* EDIT */}

                        <button
                          onClick={() => {
                            setActiveSettingIndex(
                              null
                            );

                            setEditingQuestion({
                              index,
                              data: {
                                ...q,
                                answers: [
                                  ...q.answers,
                                ],
                              },
                            });
                          }}
                          className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center"
                        >
                          <Pencil size={16} />
                        </button>

                        {/* DELETE */}

                        <button
                          onClick={() => {
                            setActiveSettingIndex(
                              null
                            );

                            setDeleteIndex(index);
                          }}
                          className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* ADD PANEL */}

            {showAddPanel && (
              <div className="bg-white border-2 border-dashed rounded-3xl p-6">
                <input
                  className="w-full border rounded-2xl px-4 py-3"
                  placeholder="Input question..."
                  value={newQuestion.question}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      question:
                        e.target.value,
                    })
                  }
                />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {newQuestion.answers.map(
                    (a, i) => (
                      <input
                        key={i}
                        className="border rounded-2xl px-4 py-3"
                        placeholder={`Answer ${
                          i + 1
                        }`}
                        value={a}
                        onChange={(e) => {
                          const updated = [
                            ...newQuestion.answers,
                          ];

                          updated[i] =
                            e.target.value;

                          setNewQuestion({
                            ...newQuestion,
                            answers: updated,
                          });
                        }}
                      />
                    )
                  )}
                </div>

                <div className="mt-6">
                  <div className="font-bold text-sm mb-2">
                    Pick Correct Answer
                  </div>

                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(
                      (i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setNewQuestion({
                              ...newQuestion,
                              correct: i,
                            })
                          }
                          className={`w-12 h-12 rounded-2xl border font-black ${
                            newQuestion.correct ===
                            i
                              ? "bg-emerald-500 text-white"
                              : ""
                          }`}
                        >
                          {String.fromCharCode(
                            65 + i
                          )}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="font-bold text-sm mb-2">
                    Difficulty
                  </div>

                  <div className="flex gap-2">
                    {[
                      "easy",
                      "medium",
                      "hard",
                    ].map((diff) => (
                      <button
                        key={diff}
                        onClick={() =>
                          setNewQuestion({
                            ...newQuestion,
                            difficulty: diff,
                          })
                        }
                        className={`px-4 py-2 rounded-xl font-bold capitalize ${
                          newQuestion.difficulty ===
                          diff
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-100"
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() =>
                      setShowAddPanel(false)
                    }
                    className="border px-5 py-3 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveQuestion}
                    className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold"
                  >
                    Save Question
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 md:p-8">
            <h2 className="text-2xl font-black">
              Delete Question
            </h2>

            <p className="text-zinc-500 mt-3">
              Are you sure you want to delete
              this question?
            </p>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() =>
                  setDeleteIndex(null)
                }
                className="border px-5 py-3 rounded-2xl font-bold"
              >
                Cancel
              </button>

              <button
                onClick={deleteQuestion}
                className="bg-red-500 text-white px-5 py-3 rounded-2xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingQuestion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full md:w-[800px] rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black">
                Edit Question
              </h2>

              <button
                onClick={() =>
                  setEditingQuestion(null)
                }
                className="border px-4 py-2 rounded-2xl font-bold"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <input
                className="w-full border rounded-2xl px-4 py-3"
                value={
                  editingQuestion.data.question
                }
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    data: {
                      ...editingQuestion.data,
                      question:
                        e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {editingQuestion.data.answers.map(
                (ans, i) => (
                  <input
                    key={i}
                    className="border rounded-2xl px-4 py-3"
                    value={ans}
                    onChange={(e) => {
                      const updated = [
                        ...editingQuestion.data
                          .answers,
                      ];

                      updated[i] =
                        e.target.value;

                      setEditingQuestion({
                        ...editingQuestion,
                        data: {
                          ...editingQuestion.data,
                          answers: updated,
                        },
                      });
                    }}
                  />
                )
              )}
            </div>

            <div className="mt-6">
              <div className="font-bold text-sm mb-2">
                Correct Answer
              </div>

              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setEditingQuestion({
                        ...editingQuestion,
                        data: {
                          ...editingQuestion.data,
                          correct: i,
                        },
                      })
                    }
                    className={`w-12 h-12 rounded-2xl border font-black ${
                      editingQuestion.data
                        .correct === i
                        ? "bg-emerald-500 text-white"
                        : ""
                    }`}
                  >
                    {String.fromCharCode(
                      65 + i
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="font-bold text-sm mb-2">
                Difficulty
              </div>

              <div className="flex gap-2">
                {[
                  "easy",
                  "medium",
                  "hard",
                ].map((diff) => (
                  <button
                    key={diff}

                    onClick={() =>
                      setEditingQuestion({
                        ...editingQuestion,
                        data: {
                          ...editingQuestion.data,
                          difficulty: diff,
                        },
                      })
                    }
                    className={`px-4 py-2 rounded-xl font-bold capitalize ${
                      editingQuestion.data
                        .difficulty === diff
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-100"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10">
              <button
                onClick={() =>
                  setEditingQuestion(null)
                }
                className="border px-5 py-3 rounded-2xl font-bold"
              >
                Cancel
              </button>

              <button
                onClick={saveEdit}
                className="bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}