import { motion } from "framer-motion";
import { Highlighter, X, Minimize2, Maximize2, Flag, BookOpen, Loader2, PlusCircle, RotateCcw, Strikethrough, ChevronRight, ChevronLeft } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { ParsedTest } from "../services/geminiService";

interface TestingPageProps {
    eliminated: Record<number, number[]>;
    currentQuestionIndex: number;
    setEliminated: (eliminated: Record<number, number[]> | ((prev: Record<number, number[]>) => Record<number, number[]>)) => void;
    setLocalWords: (words: { term: string; definition?: string }[]) => void;
    localWords: { term: string; definition?: string }[];
    isHighlighterActive: boolean;
    timeLeft: number;
    currentTest: ParsedTest;
    setCurrentQuestionIndex: Dispatch<SetStateAction<number>>;
    handleCompleteTest: (userAnswers: any, id: string) => void;
    setIsHighlighterActive: (active: boolean) => void;
}

const TestingPage = ({ 
    eliminated, currentQuestionIndex, setEliminated, setLocalWords, localWords, 
    isHighlighterActive, timeLeft, currentTest, setCurrentQuestionIndex, 
    handleCompleteTest, setIsHighlighterActive 
}: TestingPageProps) => {
    const [highlightColor] = useState<'yellow' | 'mint' | 'sky'>('yellow');
    const [loadingVocab, setLoadingVocab] = useState<string | null>(null);
    const [vocabMeanings, setVocabMeanings] = useState<Record<string, string>>({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{questionId: string, selectedIndex: number}[]>([]);

    // Load saved answers from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('aero_user_answers');
        if (saved) {
            setUserAnswers(JSON.parse(saved));
        }
    }, []);

    // Save answers to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('aero_user_answers', JSON.stringify(userAnswers));
    }, [userAnswers]);

    const handleSelectAnswer = (selectedIdx: number) => {
        const currentQuestion = currentTest.questions[currentQuestionIndex];
        
        setUserAnswers(prev => {
            // Check if this question already has an answer
            const existingIndex = prev.findIndex(
                a => a.questionId === currentQuestion._id
            );
            
            if (existingIndex !== -1) {
                // Update existing answer
                const updated = [...prev];
                updated[existingIndex] = {
                    questionId: currentQuestion._id,
                    selectedIndex: selectedIdx
                };
                return updated;
            } else {
                // Add new answer
                return [...prev, {
                    questionId: currentQuestion._id,
                    selectedIndex: selectedIdx
                }];
            }
        });

        // If this option was eliminated, remove it from eliminated
        if (eliminated[currentQuestionIndex]?.includes(selectedIdx)) {
            setEliminated(prev => ({
                ...prev,
                [currentQuestionIndex]: prev[currentQuestionIndex].filter(i => i !== selectedIdx)
            }));
        }
    };

    const toggleEliminate = (qIdx: number, oIdx: number) => {
        setEliminated(prev => {
            const qElim = prev[qIdx] || [];
            
            if (qElim.includes(oIdx)) {
                // Remove elimination
                return { ...prev, [qIdx]: qElim.filter(i => i !== oIdx) };
            } else {
                // Add elimination and remove answer if this option was selected
                if (userAnswers.find(a => a.questionId === currentTest.questions[qIdx]._id)?.selectedIndex === oIdx) {
                    setUserAnswers(prevAnswers => 
                        prevAnswers.filter(a => a.questionId !== currentTest.questions[qIdx]._id)
                    );
                }
                return { ...prev, [qIdx]: [...qElim, oIdx] };
            }
        });
    };
    
    const applyHighlight = () => {
        const selection = window.getSelection();
        if (!selection?.rangeCount || selection.isCollapsed) return;
        
        const range = selection.getRangeAt(0);
        const mark = document.createElement('mark');
        const colorClasses = { yellow: 'hl-yellow', mint: 'hl-mint', sky: 'hl-sky' };
        mark.className = colorClasses[highlightColor];
        
        try {
            range.surroundContents(mark);
        } catch (e) {
            console.warn("Highlight failed", e);
        }
        selection.removeAllRanges();
    };
    
    const clearHighlights = () => {
        document.querySelectorAll('mark').forEach(m => {
            const parent = m.parentNode;
            if (parent) {
                while (m.firstChild) parent.insertBefore(m.firstChild, m);
                parent.removeChild(m);
            }
        });
    };
    
    const fetchVocabMeaning = async (word: string) => {
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
        const newLocalWords = [...localWords, { term: word }];
        setLocalWords(newLocalWords);
        localStorage.setItem('aero_local_words', JSON.stringify(newLocalWords));
        toast.success(`"${word}" saqlandi`);
    };

    const currentQ = currentTest.questions[currentQuestionIndex];
    const isVocabQuestion = currentQ.category?.toLowerCase().includes('vocab');
    const currentAnswer = userAnswers.find(a => a.questionId === currentQ._id)?.selectedIndex;
    
    return (
        <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <div className="h-12 border-b border-slate-200 bg-white flex items-center px-2 sm:px-4 gap-1 shrink-0">
                <span className="font-mono text-xs sm:text-sm text-slate-700">
                    {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}
                </span>
                <button onClick={() => setIsHighlighterActive(!isHighlighterActive)}
                    className={`h-8 px-2 sm:px-3 rounded-md flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase transition ${
                        isHighlighterActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}>
                    <Highlighter className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isHighlighterActive ? "Active" : "Highlight"}</span>
                </button>
                <button onClick={clearHighlights}
                    className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100">
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[10px] font-semibold">Clear</span>
                </button>
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={toggleFullscreen}
                        className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span className="hidden sm:inline text-[10px] font-semibold">{isFullscreen ? "Exit" : "Full"}</span>
                    </button>
                    <button onClick={() => handleCompleteTest(userAnswers, currentTest._id)}
                        className="h-8 px-2 sm:px-4 rounded-md bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1 text-[10px] sm:text-xs font-bold">
                        <Flag className="w-3.5 h-3.5 sm:hidden" />
                        <span>{window.innerWidth < 640 ? "End" : "Finish"}</span>
                    </button>
                </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto selection:bg-blue-100 p-6 sm:p-10">
                <div className="max-w-3xl mx-auto space-y-6">
                    <div className="space-y-4">
                        <p className="text-slate-800 text-base leading-relaxed" onMouseUp={() => isHighlighterActive && applyHighlight()}>
                            {currentQ.text}
                        </p>
                        <p className="text-slate-800 font-medium text-base">{currentQ.question}</p>
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
                                        disabled={isEliminated}
                                        className={`w-full flex items-start gap-4 p-3 sm:p-3.5 text-left border rounded-xl transition-all duration-200 ${
                                            isSelected ? 'border-blue-950 bg-blue-50/30 ring-1 ring-blue-600/10' : 
                                            isEliminated ? 'border-slate-50 bg-slate-50 opacity-50 grayscale cursor-not-allowed' : 
                                            'border-slate-100 hover:border-blue-200 hover:bg-slate-50/50'
                                        }`}>
                                        <span className={`w-6 h-6 sm:w-7 sm:h-7 shrink-0 flex items-center justify-center rounded border font-black text-xs transition-all ${
                                            isSelected ? 'bg-blue-950 border-blue-950 text-white' : 
                                            'border-slate-200 text-slate-400 group-hover/opt:border-blue-950 group-hover/opt:text-blue-950 bg-white'
                                        }`}>{label}</span>
                                        <div className={`flex-1 md:pr-10 ${isEliminated ? 'line-through decoration-slate-400 italic text-slate-400' : ''}`}>
                                            <span className={`text-[13px] sm:text-[14px] font-medium ${isSelected ? 'text-blue-900' : isEliminated ? 'text-slate-400' : 'text-slate-700'}`}>
                                                {opt}
                                            </span>
                                            {isVocabQuestion && vocabMeaning && (
                                                <div className="mt-2 p-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700">
                                                    <strong>Definition:</strong> {vocabMeaning}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                    
                                    {/* Action buttons */}
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {isVocabQuestion && (
                                            <>
                                                <button onClick={() => fetchVocabMeaning(opt)} disabled={loadingVocab === opt}
                                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all md:opacity-0 md:group-hover/opt:opacity-100 disabled:opacity-50">
                                                    {loadingVocab === opt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />}
                                                </button>
                                                <button onClick={() => saveWordTemporarily(opt)}
                                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all md:opacity-0 md:group-hover/opt:opacity-100">
                                                    <PlusCircle className="w-3.5 h-3.5" />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => toggleEliminate(currentQuestionIndex, idx)}
                                            className={`p-1.5 rounded-lg transition-all ${
                                                isEliminated ? 'bg-slate-100 text-slate-500 opacity-100' : 
                                                'text-slate-200 hover:bg-slate-100 hover:text-slate-400 md:opacity-0 group-hover/opt:opacity-100'
                                            }`}>
                                            {isEliminated ? <RotateCcw className="w-3.5 h-3.5" /> : <Strikethrough className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <footer className="h-16 sm:h-20 border-t border-slate-200 px-4 sm:px-8 bg-white flex items-center justify-between">
                <button 
                    disabled={currentQuestionIndex === 0} 
                    onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-200 disabled:opacity-0 flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                
                <div className="flex-1 px-4 max-w-md hidden sm:block">
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-300" 
                            style={{ width: `${((currentQuestionIndex + 1) / currentTest.questions.length) * 100}%` }} />
                    </div>
                    <div className="text-center text-xs text-slate-400 mt-1">
                        {currentQuestionIndex + 1} / {currentTest.questions.length}
                    </div>
                </div>
                
                {currentQuestionIndex === currentTest.questions.length - 1 ? (
                    <button onClick={() => handleCompleteTest(userAnswers, currentTest._id)} 
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Submit Exam
                    </button>
                ) : (
                    <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} 
                        className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 flex items-center gap-1">
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </footer>
        </motion.div>
    );
};

export default TestingPage;