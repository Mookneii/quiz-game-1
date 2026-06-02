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

export default function EditQuiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  
  const coverInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  // No page state, just edit mode

  const [quiz, setQuiz] = useState({
    title: "",
    description: "",
    cover: null,
  });

  const [questions, setQuestions] = useState([]);

  const [showAddPanel, setShowAddPanel] =
    useState(false);

  // No preview state

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

  // No cover logic needed in edit view for questions

  // ========================================
  // LOAD QUIZ IF EDITING
  // ========================================
  useEffect(() => {
    if (quizId) {
      getQuiz(quizId)
        .then((res) => {
          if (res.data) {
            setQuiz({
              title: res.data.title || "",
              description: res.data.description || "",
              cover: null, // Assume no cover for simplicity unless handled
            });
            const loadedQs = (res.data.questions || []).map(q => {
              const correctAnswerIdx = q.choices?.findIndex(c => c.isCorrect);
              return {
                question: q.questionText,
                answers: q.choices?.map(c => c.choiceText) || ["", "", "", ""],
                correct: correctAnswerIdx >= 0 ? correctAnswerIdx : null,
                difficulty: "medium", // Default, could map from data if it existed
              };
            });
            setQuestions(loadedQs);
          }
        })
        .catch((err) => console.error("Error loading quiz", err));
    }
  }, [quizId]);

  // ========================================
  // REAL AI GENERATE
  // ========================================

  const handleAIImport = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setIsGeneratingAI(true);

    try {
      const response = await generateQuizFromDocument(
        file,
        "MEDIUM",
        "MCQ",
        5, // Requesting 5 questions by default
        "llama3.2:latest"
      );

      if (response?.data?.questions) {
        const generatedQuestions = response.data.questions.map(q => ({
          question: q.questionText || q.text || "",
          answers: [
            q.choices?.[0] || "",
            q.choices?.[1] || "",
            q.choices?.[2] || "",
            q.choices?.[3] || ""
          ],
          correct: typeof q.correctChoiceIndex === "number" ? q.correctChoiceIndex : 0,
          difficulty: q.difficulty?.toLowerCase() || "medium",
        }));
        
        setQuestions((prev) => [
          ...prev,
          ...generatedQuestions,
        ]);
        
        // Also update quiz info if it's empty
        if (!quiz.title && response.data.title) {
          setQuiz(prev => ({...prev, title: response.data.title}));
        }
        if (!quiz.description && response.data.description) {
          setQuiz(prev => ({...prev, description: response.data.description}));
        }
      }
    } catch (err) {
      alert("Error generating quiz: " + (err.response?.data?.message || err.message));
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

  return (
    <div className="min-h-screen bg-zinc-100">
      {/* NAVBAR */}

      <div className="h-16 bg-white border-b flex items-center justify-between px-6">
        <button
          onClick={() => navigate("/host")}
          className="w-10 h-10 rounded-xl hover:bg-zinc-100 flex items-center justify-center"
        >
          ←
        </button>

        <h1 className="text-xl font-black text-emerald-500">QuizUp</h1>

        <div />
      </div>

      {/* EDIT PAGE */}

      <div className="p-10">

          {/* HEADER */}

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-black">
                Edit / Add Questions
              </h2>

              <p className="text-zinc-500 mt-2">
                Manage your quiz questions
              </p>
            </div>

            <div className="flex gap-3">
              {/* DONE */}

              <button
                onClick={async () => {
                  try {
                    const mappedQuestions = questions.map(q => ({
                      questionText: q.question,
                      choices: q.answers.map((ans, i) => ({
                        choiceText: ans,
                        isCorrect: i === q.correct
                      }))
                    }));
                    
                    const token = localStorage.getItem("token");
                    const userStr = localStorage.getItem("user");
                    const user = userStr ? JSON.parse(userStr) : null;
                    
                    if (!token) {
                      navigate("/login");
                      return;
                    }
                    
                    // Actually the createQuiz API just takes SaveQuizRequest
                    await createQuiz({
                      id: quizId || null,
                      title: quiz.title || "Untitled Quiz",
                      description: quiz.description || "",
                      questions: mappedQuestions
                    });
                    
                    navigate("/host");
                  } catch (err) {
                    alert("Error saving quiz: " + err.message);
                  }
                }}
                className="bg-blue-500 text-white px-5 py-3 rounded-2xl font-bold"
              >
                Done
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
                className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 text-white ${
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
                className="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2"
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

      {/* DELETE MODAL */}

      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-[420px] rounded-3xl p-8">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white w-[800px] rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
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
  );
}