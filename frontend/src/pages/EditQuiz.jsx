// ================================================
// EDIT / ADD QUESTIONS PAGE
// ================================================
import React, { useRef, useState, useEffect } from "react"; 
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Plus, Sparkles, Pencil, Trash2, Settings2, Check, Loader2 } from "lucide-react";
import Sidebar from "../components/Sidebar";

const LOCAL_AI_URL = "http://localhost:11434/api/generate";

export default function EditQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  const aiFileInputRef = useRef(null);

  // Pull forwarded state properties from router context safely
  const quiz = location.state?.quiz || { title: "", description: "", cover: null };
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [editingQuizId] = useState(location.state?.editingQuizId || null);

  // ─── TRACKING STATE TO PREVENT INFINITE FETCH LOOPS ───
  const [hasFetched, setHasFetched] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [activeSettingIndex, setActiveSettingIndex] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answers: ["", "", "", ""],
    correct: null,
    difficulty: "easy",
  });

  // ========================================
  // FRESH DATA FETCH FROM BACKEND
  // ========================================
  useEffect(() => {
    // ✅ FIX: Fetch whenever editing an existing quiz if we haven't already fetched it on mount
    if (editingQuizId && !hasFetched) {
      const fetchQuizQuestions = async () => {
        setIsLoading(true);
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`http://localhost:8080/api/quizzes/${editingQuizId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            
            if (data && data.questions) {
              // ✅ FIX: Safe fallback parser handles both request format & database formats seamlessly
              const formattedQuestions = data.questions.map((q) => {
                // Find correct index matching whichever fields the backend provides
                let correctIdx = 0;
                if (q.correctChoiceIndex !== undefined) correctIdx = q.correctChoiceIndex;
                else if (q.correct !== undefined) correctIdx = q.correct;

                // Parse answers matching flat string array or nested choice object structures
                let standardAnswers = ["", "", "", ""];
                if (Array.isArray(q.answers)) {
                  standardAnswers = q.answers;
                } else if (Array.isArray(q.choices)) {
                  standardAnswers = q.choices.map((c) => c.choiceText || "");
                }

                return {
                  question: q.questionText || q.question || "", 
                  difficulty: q.difficulty || "easy",
                  correct: correctIdx, 
                  answers: standardAnswers, 
                };
              });

              setQuestions(formattedQuestions);
            }
            setHasFetched(true); // Flag fetch completion to prevent loop re-triggers
          }
        } catch (error) {
          console.error("Error fetching existing quiz questions:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchQuizQuestions();
    }
  }, [editingQuizId, hasFetched]);

  const handleBackToInfo = () => {
    navigate("/create-quiz", {
      state: { quiz, questions, editingQuizId },
    });
  };

  // ========================================
  // AI IMPORT PARSER
  // ========================================
  const handleAIImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsGeneratingAI(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(LOCAL_AI_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI endpoint error: ${response.status}`);
      }

      const data = await response.json();
      const generatedQuestions = Array.isArray(data) ? data : data.questions || [];

      if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
        throw new Error("Invalid response format from AI endpoint");
      }

      setQuestions((prev) => [...prev, ...generatedQuestions]);
    } catch (error) {
      console.error("Error generating questions:", error);
      alert(`Failed to generate questions: ${error.message}`);
    } finally {
      setIsGeneratingAI(false);
      e.target.value = "";
    }
  };

  // ========================================
  // MANAGING QUESTION BLOCKS
  // ========================================
  const saveQuestion = () => {
    if (!newQuestion.question.trim()) return alert("Please input question");
    if (newQuestion.answers.some((a) => a.trim() === "")) return alert("Please fill all answers");
    if (newQuestion.correct === null) return alert("Please select correct answer");

    setQuestions((prev) => [...prev, { ...newQuestion, answers: [...newQuestion.answers] }]);
    setNewQuestion({ question: "", answers: ["", "", "", ""], correct: null, difficulty: "easy" });
    setShowAddPanel(false);
  };

  const deleteQuestion = () => {
    setQuestions(questions.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const saveEdit = () => {
    if (!editingQuestion.data.question.trim()) return alert("Question required");
    if (editingQuestion.data.answers.some((a) => a.trim() === "")) return alert("All answers required");
    if (editingQuestion.data.correct === null) return alert("Please select a correct answer");

    const updated = [...questions];
    updated[editingQuestion.index] = {
      ...editingQuestion.data,
      answers: [...editingQuestion.data.answers],
    };
    setQuestions(updated);
    setEditingQuestion(null);
  };

  // ========================================
  // POST / PUT SUBMISSION HANDLER
  // ========================================
  const saveDone = async () => {
    if (!quiz.title.trim()) return alert("Please enter a quiz title in the previous screen");
    if (questions.length === 0) return alert("Please add at least one question");

    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (!token) return alert("Session expired. Please login again.");

      const quizData = {
        title: quiz.title,
        description: quiz.description,
        creatorId: user.id,
        questions: questions.map((q) => ({
          questionText: q.question,
          difficulty: q.difficulty,
          timeLimit: 30,
          correctChoiceIndex: q.correct, 
          correctAnswer: q.answers[q.correct] || "", 
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

      if (!response.ok) throw new Error("Failed to save quiz configurations");

      window.dispatchEvent(new Event("quizSaved"));
      navigate("/host");
    } catch (error) {
      alert("Failed to save quiz: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      <Sidebar activeMenu="create-quiz" isOpen={true} onToggle={() => {}} />

      <div className="flex-1 flex flex-col p-4 md:p-10">
        {/* TOP COMPONENT INTERFACE HEAD */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <button
              onClick={handleBackToInfo}
              className="w-10 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 flex items-center justify-center transition mb-4 shadow-sm"
              aria-label="Back to Quiz Details"
            >
              <ArrowLeft size={18} />
            </button>
            <h2 className="text-2xl md:text-4xl font-black">Edit / Add Questions</h2>
            <p className="text-zinc-500 mt-2">Manage your quiz question sets</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={saveDone}
              disabled={isSaving}
              className={`text-white px-5 py-3 rounded-2xl font-bold transition min-w-[100px] ${
                isSaving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              {isSaving ? "Saving..." : "Done"}
            </button>

            <input hidden type="file" ref={aiFileInputRef} onChange={handleAIImport} />
            <button
              disabled={isGeneratingAI}
              onClick={() => aiFileInputRef.current.click()}
              className={`px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 text-white ${
                isGeneratingAI ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-500"
              }`}
            >
              <Sparkles size={18} />
              {isGeneratingAI ? "Generating..." : "AI Generate"}
            </button>

            <button
              onClick={() => setShowAddPanel(true)}
              className="bg-zinc-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Question
            </button>
          </div>
        </div>

        {/* QUESTIONS DISPLAY ARRAY OR LOADING WHEEL */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 gap-2">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="font-bold">Loading questions from server...</p>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="bg-white rounded-3xl border p-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="font-black text-lg">{index + 1}. {q.question}</div>
                    <div className="mt-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-zinc-100 text-zinc-700">
                        {q.difficulty}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      {q.answers.map((ans, i) => (
                        <div
                          key={i}
                          className={`border rounded-2xl p-3 flex items-center gap-2 ${
                            q.correct === i ? "bg-emerald-50 border-emerald-400 font-medium text-emerald-900" : "text-zinc-700"
                          }`}
                        >
                          {q.correct === i && <Check size={16} className="text-emerald-600" />}
                          {ans}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SETTINGS MENU BUTTON */}
                  <div className="relative ml-4">
                    <button
                      onClick={() => setActiveSettingIndex(activeSettingIndex === index ? null : index)}
                      className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition"
                    >
                      <Settings2 size={18} />
                    </button>

                    {activeSettingIndex === index && (
                      <div className="absolute right-0 mt-2 bg-white border shadow-xl rounded-2xl p-2 flex gap-2 z-20 min-w-[110px]">
                        <button
                          onClick={() => {
                            setActiveSettingIndex(null);
                            setEditingQuestion({ index, data: { ...q, answers: [...q.answers] } });
                          }}
                          className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition text-zinc-700"
                          title="Edit Question"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setActiveSettingIndex(null);
                            setDeleteIndex(index);
                          }}
                          className="w-10 h-10 rounded-xl bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition"
                          title="Delete Question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL POPUP FOR CREATING NEW QUESTIONS */}
      {showAddPanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full md:w-[800px] rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black">Add New Question</h2>
              <button 
                onClick={() => setShowAddPanel(false)} 
                className="text-zinc-400 hover:text-zinc-600 border px-4 py-2 rounded-2xl font-bold text-sm transition"
              >
                Close
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Set Difficulty Level</label>
                <div className="flex gap-2 max-w-xs">
                  {["easy", "medium", "hard"].map((level) => {
                    const isActive = newQuestion.difficulty === level;
                    let activeStyles = "";
                    if (level === "easy") activeStyles = "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20 shadow-lg";
                    if (level === "medium") activeStyles = "bg-amber-500 border-amber-500 text-white shadow-amber-500/20 shadow-lg";
                    if (level === "hard") activeStyles = "bg-rose-500 border-rose-500 text-white shadow-rose-500/20 shadow-lg";

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setNewQuestion({ ...newQuestion, difficulty: level })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all duration-200 ${
                          isActive ? activeStyles : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Question Text</label>
                <input
                  className="w-full border rounded-2xl px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Type your question prompt here..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Answer Choices</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {newQuestion.answers.map((a, i) => (
                    <input
                      key={i}
                      className="border rounded-2xl px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                      value={a}
                      onChange={(e) => {
                        const updated = [...newQuestion.answers];
                        updated[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, answers: updated });
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Select Correct Answer</label>
                <div className="flex gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewQuestion({ ...newQuestion, correct: i })}
                      className={`w-14 h-14 rounded-2xl border-2 font-black text-lg transition-all ${
                        newQuestion.correct === i 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-100">
              <button 
                onClick={() => setShowAddPanel(false)} 
                className="border border-zinc-200 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveQuestion} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md transition"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODAL CONDITIONAL FOR DELETE */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <h2 className="text-2xl font-black">Delete Question</h2>
            <p className="text-zinc-500 mt-3">Are you sure you want to drop this question?</p>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setDeleteIndex(null)} className="border px-5 py-3 rounded-2xl font-bold hover:bg-zinc-50 transition">
                Cancel
              </button>
              <button onClick={deleteQuestion} className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl font-bold transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODAL FOR INLINE QUESTION UPDATES */}
      {editingQuestion && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full md:w-[800px] rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black">Edit Question</h2>
              <button onClick={() => setEditingQuestion(null)} className="text-zinc-400 hover:text-zinc-600 border px-4 py-2 rounded-2xl font-bold text-sm transition">
                Close
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Edit Difficulty Level</label>
                <div className="flex gap-2 max-w-xs">
                  {["easy", "medium", "hard"].map((level) => {
                    const isActive = editingQuestion.data.difficulty === level;
                    let activeStyles = "";
                    if (level === "easy") activeStyles = "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20 shadow-lg";
                    if (level === "medium") activeStyles = "bg-amber-500 border-amber-500 text-white shadow-amber-500/20 shadow-lg";
                    if (level === "hard") activeStyles = "bg-rose-500 border-rose-500 text-white shadow-rose-500/20 shadow-lg";

                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEditingQuestion({
                          ...editingQuestion,
                          data: { ...editingQuestion.data, difficulty: level }
                        })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize border transition-all duration-200 ${
                          isActive ? activeStyles : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Question Text</label>
                <input
                  className="w-full border rounded-2xl px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  value={editingQuestion.data.question}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      data: { ...editingQuestion.data, question: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Answer Choices</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {editingQuestion.data.answers.map((ans, i) => (
                    <input
                      key={i}
                      className="border rounded-2xl px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      value={ans}
                      onChange={(e) => {
                        const updated = [...editingQuestion.data.answers];
                        updated[i] = e.target.value;
                        setEditingQuestion({
                          ...editingQuestion,
                          data: { ...editingQuestion.data, answers: updated },
                        });
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-2">Select Correct Answer</label>
                <div className="flex gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setEditingQuestion({
                        ...editingQuestion,
                        data: { ...editingQuestion.data, correct: i }
                      })}
                      className={`w-14 h-14 rounded-2xl border-2 font-black text-lg transition-all ${
                        editingQuestion.data.correct === i 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-100">
              <button 
                onClick={() => setEditingQuestion(null)} 
                className="border border-zinc-200 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={saveEdit} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md transition"
              >
                Save Modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}