import { motion } from "framer-motion";
import { X, Minimize2, Maximize2, Flag, BookOpen, Loader2, PlusCircle, RotateCcw, Strikethrough, ChevronRight, ChevronLeft, FileText } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { ParsedTest } from "../services/geminiService";

interface TestingPageProps {
    eliminated: Record<number, number[]>;
    currentQuestionIndex: number;
    setEliminated: (eliminated: Record<number, number[]> | ((prev: Record<number, number[]>) => Record<number, number[]>)) => void;
    setLocalWords: (words: { term: string; definition?: string }[]) => void;
    localWords: { term: string; definition?: string }[];
    isProcessing: boolean;
    timeLeft: number;
    currentTest: ParsedTest;
    setCurrentQuestionIndex: Dispatch<SetStateAction<number>>;
    handleCompleteTest: (userAnswers: any, id: string) => void;
}

const TestingPage = ({ 
    eliminated, currentQuestionIndex, setEliminated, setLocalWords, localWords, 
    timeLeft, currentTest, setCurrentQuestionIndex, handleCompleteTest, isProcessing
}: TestingPageProps) => {
    const [loadingVocab, setLoadingVocab] = useState<string | null>(null);
    const [vocabMeanings, setVocabMeanings] = useState<Record<string, string>>({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{questionId: string, selectedIndex: number}[]>([]);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [showNotes, setShowNotes] = useState(false);
    const [tempNote, setTempNote] = useState("");
    const [isFinishing, setIsFinishing] = useState(false);
    const [isTestDisabled, setIsTestDisabled] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const testCompletedRef = useRef(false);

    const currentQ = currentTest.questions[currentQuestionIndex];
    const isVocabQuestion = currentQ.category?.toLowerCase().includes('vocab');
    const currentAnswer = userAnswers.find(a => a.questionId === currentQ._id)?.selectedIndex;
    const currentNote = notes[currentQuestionIndex];

    // Format time display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Check if time is up and auto-submit
    useEffect(() => {
        if (timeLeft <= 0 && !testCompletedRef.current && !isTestDisabled) {
            setIsTestDisabled(true);
            testCompletedRef.current = true;
            toast.error("Time's up! Submitting your test...");
            
            // Auto submit after 1 second
            const timer = setTimeout(() => {
                handleAutoComplete();
            }, 1000);
            
            return () => clearTimeout(timer);
        }
    }, [timeLeft]);

    // Load saved answers from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('aero_user_answers');
        if (saved) {
            setUserAnswers(JSON.parse(saved));
        }
        const savedNotes = localStorage.getItem('aero_test_notes');
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, []);

    // Save answers to localStorage whenever they change
    useEffect(() => {
        if (!isTestDisabled) {
            localStorage.setItem('aero_user_answers', JSON.stringify(userAnswers));
        }
    }, [userAnswers, isTestDisabled]);

    // Save notes to localStorage
    useEffect(() => {
        if (!isTestDisabled) {
            localStorage.setItem('aero_test_notes', JSON.stringify(notes));
        }
    }, [notes, isTestDisabled]);

    const handleAutoComplete = async () => {
        if (testCompletedRef.current) return;
        testCompletedRef.current = true;
        setIsFinishing(true);
        
        try {
            localStorage.removeItem('aero_test_notes');
            await handleCompleteTest(userAnswers, currentTest._id);
        } finally {
            setIsFinishing(false);
        }
    };

    const handleSelectAnswer = (selectedIdx: number) => {
        if (isTestDisabled) return;
        
        const currentQuestion = currentTest.questions[currentQuestionIndex];
        
        setUserAnswers(prev => {
            const existingIndex = prev.findIndex(
                a => a.questionId === currentQuestion._id
            );
            
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = {
                    questionId: currentQuestion._id,
                    selectedIndex: selectedIdx
                };
                return updated;
            } else {
                return [...prev, {
                    questionId: currentQuestion._id,
                    selectedIndex: selectedIdx
                }];
            }
        });

        if (eliminated[currentQuestionIndex]?.includes(selectedIdx)) {
            setEliminated(prev => ({
                ...prev,
                [currentQuestionIndex]: prev[currentQuestionIndex].filter(i => i !== selectedIdx)
            }));
        }
    };

    const toggleEliminate = (qIdx: number, oIdx: number) => {
        if (isTestDisabled) return;
        
        setEliminated(prev => {
            const qElim = prev[qIdx] || [];
            
            if (qElim.includes(oIdx)) {
                return { ...prev, [qIdx]: qElim.filter(i => i !== oIdx) };
            } else {
                if (userAnswers.find(a => a.questionId === currentTest.questions[qIdx]._id)?.selectedIndex === oIdx) {
                    setUserAnswers(prevAnswers => 
                        prevAnswers.filter(a => a.questionId !== currentTest.questions[qIdx]._id)
                    );
                }
                return { ...prev, [qIdx]: [...qElim, oIdx] };
            }
        });
    };
    
    const saveNote = () => {
        if (isTestDisabled) return;
        
        if (tempNote.trim()) {
            setNotes(prev => ({
                ...prev,
                [currentQuestionIndex]: tempNote.trim()
            }));
            setTempNote("");
            setShowNotes(false);
        }
    };

    const deleteNote = () => {
        if (isTestDisabled) return;
        
        setNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[currentQuestionIndex];
            return newNotes;
        });
        setTempNote("");
        setShowNotes(false);
    };
    
    const fetchVocabMeaning = async (word: string) => {
        if (isTestDisabled) return;
        if (vocabMeanings[word]) return;
        
        setLoadingVocab(word);
        try {
            const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
            const data = await res.json();
            const meaning = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition || 'No definition found';
            setVocabMeanings(prev => ({ ...prev, [word]: meaning }));
        } catch (e) {
            setVocabMeanings(prev => ({ ...prev, [word]: 'Definition not found' }));
        } finally {
            setLoadingVocab(null);
        }
    };
    
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };
    
    const saveWordTemporarily = (word: string) => {
        if (isTestDisabled) return;
        
        const newLocalWords = [...localWords, { term: word }];
        setLocalWords(newLocalWords);
        localStorage.setItem('aero_local_words', JSON.stringify(newLocalWords));
        toast.success(`"${word}" saqlandi`);
    };

    const handleFinishTest = async () => {
        if (isTestDisabled || testCompletedRef.current) return;
        
        setIsFinishing(true);
        testCompletedRef.current = true;
        try {
            localStorage.removeItem('aero_test_notes');
            await handleCompleteTest(userAnswers, currentTest._id);
        } finally {
            setIsFinishing(false);
        }
    };

    // Show time warning when 1 minute remaining
    useEffect(() => {
        if (timeLeft === 60) {
            toast.warning("1 minute remaining!");
        }
    }, [timeLeft]);

    return (
        <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <div className="h-12 border-b border-slate-200 bg-white flex items-center px-2 sm:px-4 gap-1 shrink-0">
                <span className={`font-mono text-sm sm:text-base font-bold ${timeLeft <= 60 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
                    {formatTime(timeLeft)}
                </span>
                
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => setShowNotes(!showNotes)} disabled={isTestDisabled}
                        className={`h-8 px-2 sm:px-3 rounded-md flex items-center gap-1 text-[10px] sm:text-xs font-semibold transition ${
                            currentNote ? "bg-blue-100 text-blue-900" : "text-slate-500 hover:bg-slate-100"
                        } ${isTestDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Notes</span>
                    </button>
                    
                    <button onClick={toggleFullscreen}
                        className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span className="hidden sm:inline text-[10px] font-semibold">{isFullscreen ? "Exit" : "Full"}</span>
                    </button>
                    
                    <button onClick={handleFinishTest} disabled={isFinishing || isTestDisabled}
                        className="h-8 px-2 sm:px-4 rounded-md bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1 text-[10px] sm:text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                        {isFinishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5 sm:hidden" />}
                        <span>{window.innerWidth < 640 ? (isFinishing ? "" : "End") : (isFinishing ? "Processing..." : "Finish")}</span>
                    </button>
                </div>
            </div>
            
            {/* Notes Modal */}
            {showNotes && !isTestDisabled && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-slate-900">Notes for Question {currentQuestionIndex + 1}</h3>
                            <button onClick={() => setShowNotes(false)} className="p-1">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea 
                            value={tempNote || currentNote || ""}
                            onChange={(e) => setTempNote(e.target.value)}
                            placeholder="Write your notes here..."
                            className="w-full h-32 p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            disabled={isTestDisabled}
                        />
                        <div className="flex gap-2 mt-3">
                            <button onClick={saveNote} disabled={isTestDisabled}
                                className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                Save Note
                            </button>
                            {currentNote && (
                                <button onClick={deleteNote} disabled={isTestDisabled}
                                    className="px-4 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Time's Up Overlay */}
            {isTestDisabled && (
                <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center pointer-events-none">
                    <div className="bg-white rounded-xl p-6 text-center pointer-events-auto">
                        <div className="text-5xl mb-4">⏰</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Time's Up!</h3>
                        <p className="text-slate-600">Your test is being submitted...</p>
                        {isFinishing && <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-blue-900" />}
                    </div>
                </div>
            )}
            
            {/* Content */}
            <div className={`flex-1 overflow-y-auto p-4 sm:p-8 ${isTestDisabled ? 'opacity-50' : ''}`}>
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="space-y-4">
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                            {currentQ.text}
                        </p>
                        <p className="text-slate-800 font-medium text-sm sm:text-base">
                            {currentQ.question}
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 pt-2">
                        {currentQ.options.map((opt: string, idx: number) => {
                            const label = String.fromCharCode(65 + idx);
                            const isSelected = currentAnswer === idx;
                            const isEliminated = eliminated[currentQuestionIndex]?.includes(idx);
                            const vocabMeaning = vocabMeanings[opt];
                            
                            return (
                                <div key={idx} className="relative group/opt">
                                    <button 
                                        onClick={() => handleSelectAnswer(idx)} 
                                        disabled={isEliminated || isTestDisabled}
                                        className={`w-full flex items-start gap-3 p-3 text-left border rounded-lg transition-all duration-150 ${
                                            isSelected ? 'border-blue-900 bg-blue-50/30' : 
                                            isEliminated ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' : 
                                            'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                        } ${isTestDisabled ? 'cursor-not-allowed' : ''}`}>
                                        <span className={`w-6 h-6 shrink-0 flex items-center justify-center rounded border text-xs font-semibold transition-all ${
                                            isSelected ? 'bg-blue-900 border-blue-900 text-white' : 
                                            'border-slate-300 text-slate-500 bg-white'
                                        }`}>{label}</span>
                                        <div className={`flex-1 text-left ${isEliminated ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                            <span className="text-xs sm:text-sm">
                                                {opt}
                                            </span>
                                            {isVocabQuestion && vocabMeaning && (
                                                <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                                                    {vocabMeaning}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                    
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                        {isVocabQuestion && (
                                            <>
                                                <button onClick={() => fetchVocabMeaning(opt)} disabled={loadingVocab === opt || isTestDisabled}
                                                    className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50">
                                                    {loadingVocab === opt ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                                                </button>
                                                <button onClick={() => saveWordTemporarily(opt)} disabled={isTestDisabled}
                                                    className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50">
                                                    <PlusCircle className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => toggleEliminate(currentQuestionIndex, idx)} disabled={isTestDisabled}
                                            className={`p-1.5 rounded transition-all ${
                                                isEliminated ? 'bg-slate-100 text-slate-500' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                                            } ${isTestDisabled ? 'cursor-not-allowed' : ''}`}>
                                            {isEliminated ? <RotateCcw className="w-3 h-3" /> : <Strikethrough className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {currentNote && !isTestDisabled && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 text-xs font-medium text-blue-900 mb-1">
                                <FileText className="w-3 h-3" />
                                <span>Your Note</span>
                            </div>
                            <p className="text-sm text-slate-700">{currentNote}</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer */}
            <footer className="h-14 border-t border-slate-200 px-3 sm:px-6 bg-white flex items-center justify-between">
                <button 
                    disabled={currentQuestionIndex === 0 || isTestDisabled} 
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-0 flex items-center gap-1 text-sm">
                    <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Prev</span>
                </button>
                
                <div className="hidden sm:block flex-1 px-4 max-w-md">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-900 transition-all duration-300" 
                            style={{ width: `${((currentQuestionIndex + 1) / currentTest.questions.length) * 100}%` }} />
                    </div>
                    <div className="text-center text-xs text-slate-400 mt-1">
                        {currentQuestionIndex + 1} / {currentTest.questions.length}
                    </div>
                </div>
                
                <div className="sm:hidden text-xs text-slate-500">
                    {currentQuestionIndex + 1}/{currentTest.questions.length}
                </div>
                
                {currentQuestionIndex === currentTest.questions.length - 1 ? (
                    <button onClick={handleFinishTest} disabled={isFinishing || isTestDisabled}
                        className="bg-blue-900 text-white px-4 py-1.5 rounded-lg hover:opacity-90 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {isFinishing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish"}
                    </button>
                ) : (
                    <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={isTestDisabled}
                        className="bg-slate-800 text-white px-4 py-1.5 rounded-lg hover:bg-slate-900 flex items-center gap-1 text-sm disabled:opacity-50">
                        <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </footer>
        </motion.div>
    );
};

export default TestingPage;