import { motion, AnimatePresence } from "framer-motion";
import { Volume2, BookOpen, Layers, ArrowLeft, ChevronLeft, ChevronRight, MessageSquare, BrainCircuit, GraduationCap, CheckCircle, XCircle, RefreshCw, Trash2, BarChart3, List, PlusCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AppUser, WordRecord } from "../types";
import api from "../services/api";
import { useUserStore } from "../states/user.state";
import { Info } from "lucide-react";
import { useWordState } from "../states/word.state";

type Mode = "flashcard" | "practice";

interface PracticeQuestion {
  sentence: string;
  correctWord: string;
  options: string[];
  explanation: string;
  wordDefinition: string;
}

interface Group {
  title: string;
  words: WordRecord[];
  _id?: string;
}

const gradients = [
  "from-rose-500 to-orange-400", "from-violet-500 to-purple-500", "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400", "from-cyan-500 to-blue-500", "from-pink-500 to-rose-400",
  "from-indigo-500 to-blue-400", "from-lime-500 to-green-400"
];

const getGradient = (index: number) => gradients[index % gradients.length];

const WordGroupView = () => {
  const navigate = useNavigate();
    const { user } = useUserStore()
  const { addWords } = useWordState()
  const { groupId } = useParams<{ groupId: string }>();
  
  const [mode, setMode] = useState<Mode>("flashcard");
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultDetails, setResultDetails] = useState<{ question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean }[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const words = group?.words && Array.isArray(group.words) ? group.words : [];
  const groupName = group?.title || "Word Group";
  const groupIdFromProps = group?._id;
  
  // Fetch group data when component mounts or groupId changes
  useEffect(() => {
    const fetchGroup = async () => {
      if (!user || !user._id) {
        setError('User not authenticated');
        setIsLoadingGroup(false);
        return;
      }

      if (!groupId) {
        setError('Group ID is missing');
        setIsLoadingGroup(false);
        return;
      }

      try {
        setIsLoadingGroup(true);
        setError(null);
        
        const response = await api.get(`/api/words/${user._id}/${groupId}`);
        setGroup(response.data);
        
      } catch (err: any) {
        console.error('Failed to fetch group:', err);
        if (err.response?.status === 404) {
          setError('Word group not found');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to view this group');
        } else {
          setError('Failed to load word group. Please try again.');
        }
      } finally {
        setIsLoadingGroup(false);
      }
    };

    fetchGroup();
  }, [user, groupId]);

  useEffect(() => {
    if (mode === "practice" && groupIdFromProps) {
      loadExistingPractice();
    }
  }, [mode, groupIdFromProps]);

  const loadExistingPractice = async () => {
    if (!groupIdFromProps) return;
    
    setIsLoading(true);
    try {
      const response = await api.get(`/api/word/practice/${groupIdFromProps}`);
      console.log(response);
      
      if (response.data && response.data.data) {
        setPracticeQuestions(response.data.data.questions);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore({ correct: 0, total: 0 });
        setPracticeCompleted(false);
        toast.success("Loaded existing practice");
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading practice:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generatePracticeQuestions = async () => {
    if (words.length === 0) {
      toast.error("No words found in this group");
      return;
    }

    setIsGenerating(true);
    
    try {
      const wordTerms = words.map(w => w.term);
      const { data: practiceRes } = await api.post('/api/ai/words/practice', { words: wordTerms });
      const questions = practiceRes.data;

      if (questions && questions.length > 0) {
        await api.post(`/api/word/practice`, {
          groupId: groupIdFromProps,
          questions
        });

        setPracticeQuestions(questions);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setScore({ correct: 0, total: 0 });
        setPracticeCompleted(false);
        toast.success(`Generated ${questions.length} practice questions!`);
      } else {
        toast.error("Failed to generate questions");
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to generate");
    } finally {
      setIsGenerating(false);
    }
  };

  const deletePractice = async () => {
    if (!groupIdFromProps) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/word/practice/${groupIdFromProps}`);
      setPracticeQuestions([]);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore({ correct: 0, total: 0 });
      setPracticeCompleted(false);
      toast.success("Practice deleted successfully");
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return;
    
    setSelectedAnswer(answer);
    const isCorrect = answer === practiceQuestions[currentQuestionIndex].correctWord;
    
    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      toast.success("Correct! 🎉");
    } else {
      toast.error(`Incorrect! Correct: "${practiceQuestions[currentQuestionIndex].correctWord}"`);
    }
    
    setShowResult(true);
    setScore(prev => ({ ...prev, total: prev.total + 1 }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < practiceQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setPracticeCompleted(true);
      toast.success(`Completed! Score: ${score.correct}/${practiceQuestions.length}`);
    }
  };

  const showResults = () => {
    const details = practiceQuestions.map((q, idx) => {
      const userAnswer = idx === currentQuestionIndex ? selectedAnswer : null;
      return {
        question: q.sentence,
        userAnswer: userAnswer || "Not answered",
        correctAnswer: q.correctWord,
        isCorrect: userAnswer === q.correctWord
      };
    });
    setResultDetails(details);
    setShowResultModal(true);
  };

  const restartPractice = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
    setPracticeCompleted(false);
  };

  const creatingTest = () => {
    addWords(group.words);
    navigate(`/ai-generator?group=${group.title}`);
  }

  const speakText = (text: string) => { 
    const utterance = new SpeechSynthesisUtterance(text); 
    utterance.lang = 'en-US'; 
    utterance.rate = 0.9; 
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance); 
  };
  
  const progress = ((activeIndex + 1) / words.length) * 100;
  const activeWord = words[activeIndex];

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  const goNext = () => { 
    if (activeIndex < words.length - 1) { 
      setDirection(1); 
      setActiveIndex(prev => prev + 1); 
    } 
  };
  
  const goPrev = () => { 
    if (activeIndex > 0) { 
      setDirection(-1); 
      setActiveIndex(prev => prev - 1); 
    } 
  };

  const selectWord = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  const handleBack = () => {
    navigate('/words');
  };

  // Loading state
  if (isLoadingGroup) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 px-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-950 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 font-medium">Loading word group...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 px-4">
        <div className="text-center space-y-4 max-w-md">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-base font-medium">{error || 'No words found'}</p>
          {error && (
            <p className="text-sm text-slate-400">{error}</p>
          )}
          <button 
            onClick={handleBack} 
            className="px-5 py-2.5 bg-blue-950 text-white rounded-lg text-sm hover:bg-blue-900 transition-colors"
          >
            Back to Lexicon
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <ArrowLeft className="md:w-5 w-3 md:h-5 h-3" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-blue-950 max-md:text-sm! truncate">{groupName}</h2>
            <p className="text-xs text-slate-400">{words.length} words</p>
          </div>
          <div className="grid gap-2 grid-cols-3">
            <button
              onClick={() => setMode("flashcard")}
              className={`flex items-center gap-1 md:rounded-lg md:px-3 px-1 md:py-2 py-1 md:text-sm text-xs transition ${mode === "flashcard" ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}
            >
              <Layers size={16} /> <span className="max-md:hidden">Cards</span>
            </button>

            <button
              onClick={() => setMode("practice")}
              className={`flex items-center gap-1 md:rounded-lg md:px-3 px-1 md:py-2 py-1 md:text-sm text-xs transition ${mode === "practice" ? "bg-violet-600 text-white" : "bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
            >
              <GraduationCap size={16} /> <span className="max-md:hidden">Practice</span>
            </button>

            <button
              onClick={creatingTest}
              className="flex items-center gap-1 md:rounded-lg bg-emerald-50 md:px-3 px-1 md:py-2 py-1 md:text-sm text-xs text-emerald-700 transition hover:bg-emerald-100"
            >
              <PlusCircle size={16} /> <span className="max-md:hidden">Create</span>
            </button>
          </div>
        </div>
      </div>

      {mode === "flashcard" && (
        <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4">
          {/* Flashcard Section */}
          <div className="flex-1">
            <div className="h-0.5 bg-slate-200 w-full mb-4 rounded-full overflow-hidden">
              <div className="h-full bg-blue-950 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="w-full max-w-md relative">
                <AnimatePresence mode="wait" custom={direction}>
                  {activeWord && (
                    <motion.div 
                      key={activeWord._id} 
                      custom={direction} 
                      initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }} 
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }} 
                      transition={{ duration: 0.25 }}
                    >
                      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className={`bg-gradient-to-r ${getGradient(activeIndex)} p-6 text-white`}>
                          <div className="flex items-center justify-between mb-3">
                            <button 
                              onClick={() => speakText(activeWord.term)} 
                              className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                              <Volume2 className="w-5 h-5" />
                            </button>
                            <div className="text-5xl font-black text-white/20">{String(activeIndex + 1).padStart(2, "0")}</div>
                          </div>
                          <h1 className="text-3xl font-black capitalize break-words">{activeWord.term}</h1>
                        </div>
                        <div className="p-6">
                          <div className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-1 h-5 bg-blue-950 rounded-full" />
                              <span className="text-xs text-slate-400 uppercase tracking-wide">Meaning</span>
                            </div>
                            <p className="text-slate-700 text-base">{activeWord.definition}</p>
                          </div>
                          {activeWord.sentence && (
                            <div className="pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="text-xs text-slate-400 uppercase tracking-wide">Example</span>
                                </div>
                                <button 
                                  onClick={() => speakText(activeWord.sentence!)} 
                                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                                >
                                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                              </div>
                              <p className="text-slate-600 text-sm italic">"{activeWord.sentence}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 mt-4 max-w-md mx-auto">
              <button 
                onClick={goPrev} 
                disabled={activeIndex === 0} 
                className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />Prev
              </button>
              <div className="text-xs text-slate-400 px-3 font-medium">{activeIndex + 1} / {words.length}</div>
              <button 
                onClick={goNext} 
                disabled={activeIndex === words.length - 1} 
                className="flex-1 py-3 rounded-xl bg-blue-950 text-white font-medium text-sm disabled:opacity-40 hover:bg-blue-900 transition-colors"
              >
                Next<ChevronRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          </div>

          {/* Playlist Section */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-[73px] shadow-sm">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-blue-950" />
                  <h3 className="font-semibold text-sm text-slate-700">Word List</h3>
                </div>
                <span className="text-xs text-slate-400">{words.length} words</span>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                {words.map((word, idx) => (
                  <button
                    key={word._id}
                    onClick={() => selectWord(idx)}
                    className={`w-full flex items-center gap-3 p-3 text-left border-l-4 transition-all ${
                      idx === activeIndex 
                        ? "border-l-blue-950 bg-blue-50" 
                        : "border-l-transparent hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      idx === activeIndex 
                        ? "bg-blue-950 text-white" 
                        : "bg-slate-100 text-slate-400"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${
                        idx === activeIndex ? "text-blue-950" : "text-slate-700"
                      }`}>
                        {word.term}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{word.definition}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); speakText(word.term); }}
                      className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "practice" && (
        <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 py-3 flex gap-2 flex-wrap">
            <button
              onClick={generatePracticeQuestions}
              disabled={isGenerating}
              className="flex-1 min-w-[120px] py-2.5 bg-blue-950 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
              {isGenerating ? "Generating..." : "Generate New"}
            </button>
            
            {practiceQuestions.length > 0 && (
              <>
              {practiceCompleted && (
                <button
                  onClick={showResults}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Results</span>
                </button>
              )}
                
                <button
                  onClick={deletePractice}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"
                >
                  {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">Delete</span>
                </button>
              </>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-950 rounded-full animate-spin mx-auto" />
                <p className="text-slate-600 font-medium">Loading practice...</p>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-950 rounded-full animate-spin mx-auto" />
                <p className="text-slate-600 font-medium">AI is generating questions...</p>
              </div>
            </div>
          ) : practiceQuestions.length > 0 && !practiceCompleted ? (
            <div className="max-w-2xl mx-auto px-4 py-6">
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-600 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {practiceQuestions.length}</span>
                  <span>Score: {score.correct}/{score.total || 0}</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-950 rounded-full transition-all duration-300" 
                       style={{ width: `${((currentQuestionIndex + 1) / practiceQuestions.length) * 100}%` }} />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium flex items-center text-slate-700 gap-2">
                      <GraduationCap className="w-6 h-6 text-blue-950" />
                      <span>Complete the sentence</span>
                    </h3>
                  </div>
                  <p className="md:text-xl text-sm md:font-semibold leading-relaxed">
                    {practiceQuestions[currentQuestionIndex].sentence.split("______").map((part, i, arr) => (
                      <span key={i} className="text-slate-600">
                        {part}
                        {i < arr.length - 1 && (
                          <span className={`rounded-lg text-center text-slate-700 font-bold`}>
                            {showResult ? practiceQuestions[currentQuestionIndex].correctWord : "______"}
                          </span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>

                <div className="p-6 pt-0">
                  <div className="mb-6">
                    <p className="text-sm text-slate-500 mb-3">Choose the correct word:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {practiceQuestions[currentQuestionIndex].options.map((option, idx) => {
                        const isCorrect = option === practiceQuestions[currentQuestionIndex].correctWord;
                        const isSelected = selectedAnswer === option;
                        let buttonClass = "p-3 rounded-xl border-2 text-left font-medium transition-all ";
                        
                        if (showResult) {
                          if (isCorrect) buttonClass += "bg-green-50 border-green-500 text-green-700";
                          else if (isSelected && !isCorrect) buttonClass += "bg-red-50 border-red-500 text-red-700 line-through";
                          else buttonClass += "bg-slate-50 border-slate-200 text-slate-400";
                        } else {
                          buttonClass += isSelected ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-white border-slate-200 hover:border-blue-300 text-slate-700 hover:bg-slate-50";
                        }
                        
                        return (
                          <button key={idx} onClick={() => handleAnswerSelect(option)} disabled={showResult} className={buttonClass}>
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                              {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {showResult && (
                    <div className="mb-6 md:p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 md:rounded-xl border border-slate-200 bg-slate-50 md:p-4 p-2 space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                              <Info className="h-5 w-5" />
                            </div>

                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-slate-900">
                                Explanation
                              </h3>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {practiceQuestions[currentQuestionIndex].explanation}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 border-t border-slate-200 pt-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                              <BookOpen className="h-5 w-5" />
                            </div>

                            <div className="flex-1">
                              <h3 className="text-sm font-semibold text-slate-900">
                                Definition
                              </h3>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {practiceQuestions[currentQuestionIndex].wordDefinition}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showResult && (
                    <button 
                      onClick={nextQuestion} 
                      className="w-full py-3 bg-blue-950 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors"
                    >
                      {currentQuestionIndex + 1 === practiceQuestions.length ? "Finish Practice" : "Next Question"}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : practiceCompleted ? (
            <div className="flex items-center justify-center min-h-[400px] px-4">
              <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-blue-950 mb-2">Practice Complete! 🎉</h2>
                <p className="text-slate-600 mb-4">
                  You got <span className="font-bold text-blue-950">{score.correct}</span> out of <span className="font-bold">{practiceQuestions.length}</span> correct
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={restartPractice} className="flex-1 py-3 bg-blue-950 text-white rounded-xl font-medium hover:bg-blue-900 transition-colors">
                    Try Again
                  </button>
                  <button onClick={generatePracticeQuestions} className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                    New Practice
                  </button>
                  <button onClick={showResults} className="px-4 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
                    View Results
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px] px-4">
              <div className="text-center space-y-4">
                <GraduationCap className="w-20 h-20 text-slate-300 mx-auto" />
                <p className="text-slate-500 font-medium">Click "Generate New" to start practicing</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-950 to-blue-800">
              <h3 className="text-lg font-bold text-white">Practice Results</h3>
              <button 
                onClick={() => setShowResultModal(false)} 
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
              >
                <XCircle className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-blue-950">{score.correct} / {practiceQuestions.length}</p>
                <p className="text-slate-600 mt-1">You got {Math.round((score.correct / practiceQuestions.length) * 100)}% correct</p>
              </div>

              <div className="space-y-3">
                {resultDetails.map((detail, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${detail.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start gap-2">
                      {detail.isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 mb-1">{detail.question}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="text-slate-500">Your answer:</span>
                          <span className={detail.isCorrect ? "text-green-700 font-medium" : "text-red-700 font-medium"}>
                            {detail.userAnswer}
                          </span>
                          {!detail.isCorrect && (
                            <>
                              <span className="text-slate-500">Correct:</span>
                              <span className="text-green-700 font-medium">{detail.correctAnswer}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-2.5 bg-blue-950 text-white rounded-xl font-medium hover:bg-blue-900 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default WordGroupView;