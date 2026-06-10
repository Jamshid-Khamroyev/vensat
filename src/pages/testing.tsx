import { motion } from "framer-motion";
import { X, Minimize2, Maximize2, Flag, BookOpen, Loader2, PlusCircle, Strikethrough, ChevronRight, ChevronLeft, Grid3x3, Eye, EyeOff, Circle, Clock } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ParsedTest } from "../services/geminiService";
import TestNote from "../shared/test-note";
import Pessage from "../shared/pessage";
import api from "../services/api";

interface TestingPageProps {
  eliminated: Record<number, number[]>;
  currentQuestionIndex: number;
  setEliminated: (eliminated: Record<number, number[]> | ((prev: Record<number, number[]>) => Record<number, number[]>)) => void;
  currentTest: ParsedTest;
  setCurrentQuestionIndex: Dispatch<SetStateAction<number>>;
  handleCompleteTest: (userAnswers: any, id: string) => void;
  setCurrentTest: Dispatch<SetStateAction<ParsedTest>>;
}

const TestingPage = ({ eliminated, currentQuestionIndex, setEliminated, currentTest, setCurrentQuestionIndex, handleCompleteTest, setCurrentTest }: TestingPageProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [showNotes, setShowNotes] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [isFinishing, setIsFinishing] = useState(false);
  const [isTestDisabled, setIsTestDisabled] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [isPageLoading, setIsPageLoading] = useState(true);
  const testCompletedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = currentTest?.questions?.[currentQuestionIndex];
  const currentAnswer = userAnswers.find(a => a.questionId === currentQ?._id)?.selectedIndex;
  const isCurrentMarked = markedForReview.has(currentQ?._id);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = userAnswers.length;

  const startTest = async (testId: string) => {
    setIsPageLoading(true);
    try {
      setEliminated({});
      const response = await api.get(`/api/tests/${testId}`);
      const test = response.data;
      setCurrentTest(test);
      setTimeLeft(test.timeLimit * 60);
      if (searchParams.get("q")) setCurrentQuestionIndex(parseInt(searchParams.get("q") || "0"));
    } catch (error) {
      toast.error("Failed to load test");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    if (id) startTest(id);
  }, [id]);

  useEffect(() => {
    setSearchParams({ q: currentQuestionIndex.toString() });
  }, [currentQuestionIndex, setSearchParams]);

  useEffect(() => {
    if (isPageLoading || isTestDisabled || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTestDisabled(true);
          testCompletedRef.current = true;
          toast.error("Time's up! Submitting your test...");
          setTimeout(() => handleAutoComplete(), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPageLoading, isTestDisabled, timeLeft]);

  useEffect(() => {
    if (timeLeft === 60) toast.warning("1 minute remaining!");
  }, [timeLeft]);

  const handleAutoComplete = async () => {
    if (testCompletedRef.current) return;
    testCompletedRef.current = true;
    setIsFinishing(true);
    try {
      localStorage.clear();
      await handleCompleteTest(userAnswers, currentTest._id);
    } finally {
      setIsFinishing(false);
    }
  };

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
    <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="bg-white flex items-center justify-between px-4 md:px-6 py-4 shrink-0">
        <div className="text-sm md:text-base font-medium text-slate-900 truncate max-w-[30%]">
          {currentTest?.title || "Loading..."}
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center flex-col">
          <div>
            {showTimer ? (
              <span className={`font-mono text-base font-bold ${timeLeft <= 300 ? "text-red-600" : "text-slate-700"}`}>
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
        
        <button onClick={toggleFullscreen} className="p-1 rounded text-slate-500">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <div className="border-b border-slate-300 h-px" />

      {showNotes && !isTestDisabled && <TestNote setShowNotes={setShowNotes} currentQuestionIndex={currentQuestionIndex} tempNote={tempNote} setTempNote={setTempNote} currentNote={""} isTestDisabled={isTestDisabled} setNotes={() => {}} />}

      {isTestDisabled && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded p-6 text-center pointer-events-auto shadow-xl">
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Time's Up!</h3>
            <p className="text-slate-600">Your test is being submitted...</p>
            {isFinishing && <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-blue-950" />}
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-auto ${isTestDisabled ? "opacity-50" : ""}`}>
        <div className="flex flex-col lg:flex-row h-full">
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-300 bg-white">
            <div className="p-4 md:p-6 min-h-[45vh] lg:min-h-[unset]">
              <div className="prose prose-sm max-w-none">
                <Pessage currentQ={currentQ} />
              </div>
            </div>
          </div>

          <div className={`w-full lg:w-1/2 bg-white overflow-y-auto`}>
            <div className="p-4 md:p-6">
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
                        <button onClick={() => handleSelectAnswer(idx)} disabled={isEliminated || isTestDisabled} className={`w-full text-left p-4 rounded border border-slate-300 ${isSelected ? "bg-blue-50 border-blue-950" : isEliminated ? "bg-white" : "bg-white"}`}>
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 flex items-center justify-center border-2 rounded-full text-sm font-bold ${isSelected ? "bg-blue-950 text-white border-blue-950" : "text-slate-600 border-slate-300"}`}>{label}</span>
                            <div className={`flex-1 ${isEliminated ? "text-slate-400" : "text-slate-800"}`}>
                              <div className="max-md:text-sm">{opt}</div>
                            </div>
                          </div>
                        </button>

                        <div style={{ width: 88 }} className="flex flex-col items-center justify-center">
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