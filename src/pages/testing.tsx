import { motion } from "framer-motion";
import { X, Minimize2, Maximize2, AlarmClock, Flag, Loader2, Strikethrough, ChevronRight, ChevronLeft, Grid3x3, Eye, EyeOff, Clock, NotebookPen } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner"; 
import TestNote from "../shared/test-note";
import Pessage from "../shared/pessage";
import api from "../services/api";
import { useWordState } from "../states/word.state";

const TestingPage = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { setResult } = useWordState()
  const [eliminated, setEliminated] = useState<Record<number, number[]>>({});
  const [currentTest, setCurrentTest] = useState(null);

  
  const navigate = useNavigate()
  const [timeLeft, setTimeLeft] = useState(0);
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [isTestDisabled, setIsTestDisabled] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [isPageLoading, setIsPageLoading] = useState(true);
  const testCompletedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Split pane state
  const [splitPosition, setSplitPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentQ = currentTest?.questions?.[currentQuestionIndex];
  const currentAnswer = userAnswers.find(a => a.questionId === currentQ?._id)?.selectedIndex;
  const isCurrentMarked = markedForReview.has(currentQ?._id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = userAnswers.length;

  const getCurrentTest = async () => {
    try {
      const { data } = await api.get(`/api/tests/${id}`)
      setTimeLeft(data.timeLimit * 60)
      setCurrentTest(data)
    } catch (error) {
      console.log(error);
    } finally {
      setIsPageLoading(false)
    }
  }

  useEffect(() => {
    getCurrentTest()
    if (id) navigate(`/testing/${id}`);
  }, [id]);

  useEffect(() => {
    setSearchParams({ q: currentQuestionIndex.toString() });
  }, [currentQuestionIndex, setSearchParams]);

  const handleAutoComplete = async () => {
    setIsFinishing(true);
    try {
      await handleCompleteTest(userAnswers, currentTest._id);
    } finally {
      setIsFinishing(false);
      setIsTestDisabled(false)
    }
  };

  useEffect(() => {
  if (isPageLoading || isTestDisabled) return;

  timerRef.current = setInterval(() => {
    setTimeLeft(prev => {
      const next = Math.max(prev - 1, 0);

      if (next === 0 && !testCompletedRef.current) {
        clearInterval(timerRef.current);

        testCompletedRef.current = true;
        setIsTestDisabled(true);

        toast.warning("Time's up! Submitting your test...");

        setTimeout(() => {
          handleAutoComplete();
        }, 1000);
      }

      return next;
    });
  }, 1000);

  return () => clearInterval(timerRef.current);
}, [isPageLoading, isTestDisabled, handleAutoComplete]);

  const handleSelectAnswer = (selectedIdx: number) => {
    if (isTestDisabled) return;
    if (eliminated[currentQuestionIndex]?.includes(selectedIdx)) return;
    const currentQuestion = currentTest.questions[currentQuestionIndex];
    setUserAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === currentQuestion._id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { questionId: currentQuestion._id, selectedIndex: selectedIdx };
        return updated;
      }
      return [...prev, { questionId: currentQuestion._id, selectedIndex: selectedIdx }];
    });
    if (eliminated[currentQuestionIndex]?.includes(selectedIdx)) {
      setEliminated(prev => ({ ...prev, [currentQuestionIndex]: prev[currentQuestionIndex].filter(i => i !== selectedIdx) }));
    }
  };

  const toggleEliminate = (qIdx: number, oIdx: number) => {
    if (isTestDisabled) return;
    setEliminated(prev => {
      const qElim = prev[qIdx] || [];
      if (qElim.includes(oIdx)) {
        return { ...prev, [qIdx]: qElim.filter(i => i !== oIdx) };
      }
      if (userAnswers.find(a => a.questionId === currentTest.questions[qIdx]._id)?.selectedIndex === oIdx) {
        setUserAnswers(prevAnswers => prevAnswers.filter(a => a.questionId !== currentTest.questions[qIdx]._id));
      }
      return { ...prev, [qIdx]: [...qElim, oIdx] };
    });
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQ._id)) newSet.delete(currentQ._id); else newSet.add(currentQ._id);
      return newSet;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); setIsFullscreen(true); } else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const handleFinishTest = async () => {
    if (isTestDisabled || testCompletedRef.current) return;
    setIsFinishing(true);
    testCompletedRef.current = true;
    try {
      await handleCompleteTest(userAnswers, currentTest._id);
    } finally {
      setIsFinishing(false);
    }
  };

   const handleCompleteTest = async (answers: {questionId: string, selectedIndex: number}[], id: string) => {
    try {
      const response = await api.post(`/api/tests/${id}/check`, { answers });
      setResult(response.data);
      navigate('/results')
    } catch (error) { 
      console.log(`Error completing test: ${error}`);
    }
  };

  const goToQuestion = (index: number) => {
    if (isTestDisabled) return;
    setCurrentQuestionIndex(index);
    setShowNavigator(false);
  };

  const getQuestionStatus = (index: number) => {
    const question = currentTest.questions[index];
    const isAnswered = userAnswers.some(a => a.questionId === question._id);
    const isCurrent = index === currentQuestionIndex;
    if (isCurrent) return "current";
    if (isAnswered) return "answered";
    return "unanswered";
  };

  // Split pane drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedPosition = Math.max(15, Math.min(85, newPosition));
    setSplitPosition(clampedPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (isPageLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-blue-950 animate-spin" />
      </div>
    );
  }

  if (!currentTest || !currentQ) {
    return (
      <motion.div key="testing-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Test not found</h3>
          <p className="text-slate-600">Please try again later</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 w-full z-50 flex flex-col bg-white">
      <div className="bg-white flex items-center justify-between px-4 md:px-6 py-4 shrink-0">
        <div className="text-sm md:text-base font-medium text-slate-900 truncate max-w-[30%]">
          {currentTest?.title || "Loading..."}
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center flex-col">
          <div>
            {showTimer ? (
              <span className={`font-mono text-base font-bold ${timeLeft <= 300 ? "text-red-600" : "text-slate-700"}`} >
                {formatTime(timeLeft)}
              </span>
            ) : (
              <Clock className="w-6 h-6 opacity-60" />
            )}
          </div>
          <button onClick={() => setShowTimer(!showTimer)} className="p-1 rounded text-slate-400">
            {showTimer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setTempNote(notes[currentQuestionIndex] || ""); setShowNotes(true); }}
            aria-label="Notes"
            title="Notes"
            className={`p-1.5 rounded ${notes[currentQuestionIndex] ? "text-primary" : "text-slate-500"}`}
          >
            <NotebookPen className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} aria-label="Fullscreen" className="p-1.5 rounded text-slate-500">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="border-b border-slate-300 h-px" />

      {showNotes && !isTestDisabled && <TestNote setShowNotes={setShowNotes} currentQuestionIndex={currentQuestionIndex} tempNote={tempNote} setTempNote={setTempNote} currentNote={notes[currentQuestionIndex] || null} isTestDisabled={isTestDisabled} setNotes={setNotes} />}

      {(isTestDisabled && isFinishing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full mx-2 max-w-sm rounded-2xl bg-white p-8 shadow-2xl border border-slate-200">
            <div className="flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
                <AlarmClock className="h-10 w-10 text-red-600" />
              </div>
            </div>

            <h2 className="mt-6 text-center text-2xl font-bold text-slate-900">
              Time's Up!
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-600">
              The allotted time has expired.
              <br />
              Your answers are being submitted automatically.
            </p>

            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-slate-50 py-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-950" />
              <span className="text-sm font-medium text-slate-700">
                Finalizing your test...
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-auto ${isTestDisabled ? "opacity-50" : ""} w-full`}>
        <div ref={containerRef} className="flex md:flex-row flex-col max-md:w-full h-full relative">
          {/* Left panel - Pessage */}
          <div 
            className="bg-white"
            style={
              window.innerWidth >= 800
                ? { width: `${splitPosition}%` }
                : {}
            }
          >
            <div className="p-2 md:p-6 min-h-[45vh] lg:min-h-[unset]">
              <div className="prose prose-sm max-w-none">
                <Pessage currentQ={currentQ} />
              </div>
            </div>
          </div>

          {/* Splitter - draggable divider */}
          <div 
            className="relative max-md:hidden flex items-center justify-center cursor-col-resize z-10"
            style={{ width: '8px', flexShrink: 0 }}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-slate-300 hover:bg-blue-400 transition-colors" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-6 cursor-col-resize" />
          </div>

          {/* Right panel - Question and Options */}
          <div 
            className="bg-white"
             style={
                window.innerWidth >= 800
                  ? { width: `${100 - splitPosition}%` }
                  : {}
              }
          >
            <div className="p-2 md:p-6">
              <div className="w-full mx-auto">
                <div className="flex items-center justify-between bg-slate-100 mb-4 p-1">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-blue-950 text-white flex items-center justify-center text-sm font-bold">{currentQuestionIndex + 1}</span>
                    <button onClick={toggleMarkForReview} className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${isCurrentMarked ? "text-red-600" : "text-slate-500"}`}>
                      <Flag className={`w-3.5 h-3.5 ${isCurrentMarked ? "fill-red-600" : ""}`} />
                      Mark for Review
                    </button>
                  </div>
                </div>

                <p className="text-slate-800 text-base leading-relaxed mb-6 font-medium">{currentQ.question}</p>

                <div className="space-y-4">
                  {currentQ.options.map((opt: string, idx: number) => {
                    const label = String.fromCharCode(65 + idx);
                    const isSelected = currentAnswer === idx;
                    const isEliminated = eliminated[currentQuestionIndex]?.includes(idx);
                    return (
                      <div key={idx} className="relative flex items-center">
                        <button onClick={() => handleSelectAnswer(idx)} disabled={isEliminated || isTestDisabled} className={`w-full text-left md:p-4 p-1.5 rounded border border-slate-300 ${isSelected ? "bg-blue-50 border-blue-950" : isEliminated ? "bg-white" : "bg-white"}`}>
                          <div className="flex items-center md:gap-4 gap-2">
                            <span className={`w-8 h-8 flex items-center justify-center border-2 rounded-full text-sm font-bold ${isSelected ? "bg-blue-950 text-white border-blue-950" : "text-slate-600 border-slate-300"}`}>{label}</span>
                            <div className={`flex-1 ${isEliminated ? "text-slate-400" : "text-slate-800"}`}>
                              <div className="max-md:text-sm">{opt}</div>
                            </div>
                          </div>
                        </button>

                        <div style={{ width: 43 }} className="flex flex-col items-center justify-center">
                          {!isEliminated ? (
                            <button onClick={() => toggleEliminate(currentQuestionIndex, idx)} disabled={isTestDisabled} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-400 bg-white text-slate-700">
                              <Strikethrough className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="w-full flex items-center justify-between">
                              <button onClick={() => toggleEliminate(currentQuestionIndex, idx)} className="text-sm text-slate-900 ml-2">Undo</button>
                            </div>
                          )}
                        </div>

                        {isEliminated && <div className="absolute left-4 right-20 top-1/2 -translate-y-1/2 border-t border-black" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-300 h-px" />

      <div className="bg-white px-4 md:px-6 py-4 shrink-0">
        <div className="flex items-center justify-between md:justify-center gap-3">
          <button disabled={currentQuestionIndex === 0 || isTestDisabled} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-slate-700 bg-white">
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden md:inline">Back</span>
          </button>

          <button onClick={() => setShowNavigator(true)} className="flex items-center gap-2 text-sm text-slate-700 font-medium bg-blue-950 text-white px-3 py-2 rounded">
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden md:inline">Question {currentQuestionIndex + 1} of {currentTest.questions.length}</span>
            <span className="md:hidden text-xs">{currentQuestionIndex + 1}/{currentTest.questions.length}</span>
          </button>

          {currentQuestionIndex === currentTest.questions.length - 1 ? (
            <button onClick={handleFinishTest} disabled={isFinishing || isTestDisabled} className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-bold text-white bg-blue-950">
              {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
            </button>
          ) : (
            <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={isTestDisabled} className="flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-bold text-white bg-blue-950">
              <span className="hidden md:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {showNavigator && !isTestDisabled && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowNavigator(false)}>
          <div className="bg-white shadow-2xl w-full max-w-4xl p-6 mb-0 md:mb-20 rounded-none md:rounded" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Question Navigator</h3>
              <button onClick={() => setShowNavigator(false)} className="p-1 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-8 sm:grid-cols-12 gap-2 max-h-[40vh] overflow-y-auto">
              {currentTest.questions.map((_, idx) => {
                const status = getQuestionStatus(idx);
                const isMarked = markedForReview.has(currentTest.questions[idx]._id);
                return (
                  <button key={idx} onClick={() => goToQuestion(idx)} className={`h-10 rounded text-sm font-bold border ${status === "current" ? "bg-blue-950 text-white border-blue-950" : status === "answered" ? "bg-blue-950 text-white border-blue-950" : "bg-white text-slate-700 border-slate-300"}`}>
                    {idx + 1}
                    {isMarked && <Flag className="w-3 h-3 absolute -top-1 -right-1 fill-red-500 text-red-500" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-300 flex justify-between text-xs font-medium text-slate-600">
              <span>● Answered: {answeredCount}</span>
              <span>○ Unanswered: {currentTest.questions.length - answeredCount}</span>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default TestingPage;