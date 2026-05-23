import { motion } from "framer-motion";
import { Highlighter, X, Minimize2, Maximize2, Flag, BookOpen, Loader2, PlusCircle, RotateCcw, Strikethrough, ChevronRight, ChevronLeft, FileText } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { ParsedTest } from "../services/geminiService";

interface TestingPageProps {
    eliminated: Record<number, number[]>;
    currentQuestionIndex: number;
    setEliminated: (eliminated: Record<number, number[]> | ((prev: Record<number, number[]>) => Record<number, number[]>)) => void;
    setLocalWords: (words: { term: string; definition?: string }[]) => void;
    localWords: { term: string; definition?: string }[];
    isHighlighterActive: boolean;
    isProcessing: boolean;
    timeLeft: number;
    currentTest: ParsedTest;
    setCurrentQuestionIndex: Dispatch<SetStateAction<number>>;
    handleCompleteTest: (userAnswers: any, id: string) => void;
    setIsHighlighterActive: (active: boolean) => void;
}

const TestingPage = ({ 
    eliminated, currentQuestionIndex, setEliminated, setLocalWords, localWords, 
    isHighlighterActive, timeLeft, currentTest, setCurrentQuestionIndex, 
    handleCompleteTest, setIsHighlighterActive, isProcessing
}: TestingPageProps) => {
    const [highlightColor, setHighlightColor] = useState<'yellow' | 'pink' | 'green'>('yellow');
    const [loadingVocab, setLoadingVocab] = useState<string | null>(null);
    const [vocabMeanings, setVocabMeanings] = useState<Record<string, string>>({});
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{questionId: string, selectedIndex: number}[]>([]);
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [showNotes, setShowNotes] = useState(false);
    const [tempNote, setTempNote] = useState("");
    const passageRef = useRef<HTMLDivElement>(null);

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
        localStorage.setItem('aero_user_answers', JSON.stringify(userAnswers));
    }, [userAnswers]);

    // Save notes to localStorage
    useEffect(() => {
        localStorage.setItem('aero_test_notes', JSON.stringify(notes));
    }, [notes]);

    const handleSelectAnswer = (selectedIdx: number) => {
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
    
    const applyHighlight = () => {
        if (!isHighlighterActive) return;
        
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) return;
        
        const range = selection.getRangeAt(0);
        
        // Only allow highlighting within passage container
        if (passageRef.current && !passageRef.current.contains(range.commonAncestorContainer)) {
            selection.removeAllRanges();
            return;
        }
        
        if (range.collapsed) return;
        
        const selectedText = range.toString();
        if (!selectedText.trim()) return;
        
        try {
            const span = document.createElement('span');
            if (highlightColor === 'yellow') {
                span.style.backgroundColor = '#fef08a';
            } else if (highlightColor === 'pink') {
                span.style.backgroundColor = '#fbcfe8';
            } else if (highlightColor === 'green') {
                span.style.backgroundColor = '#bbf7d0';
            }
            span.style.padding = '0';
            span.style.borderRadius = '0';
            span.className = `highlight-${highlightColor}`;
            
            range.deleteContents();
            span.appendChild(document.createTextNode(selectedText));
            range.insertNode(span);
            selection.removeAllRanges();
        } catch (e) {
            // Fallback for complex selections
            const span = document.createElement('span');
            if (highlightColor === 'yellow') {
                span.style.backgroundColor = '#fef08a';
            } else if (highlightColor === 'pink') {
                span.style.backgroundColor = '#fbcfe8';
            } else if (highlightColor === 'green') {
                span.style.backgroundColor = '#bbf7d0';
            }
            span.style.padding = '0';
            span.style.borderRadius = '0';
            span.className = `highlight-${highlightColor}`;
            span.textContent = selectedText;
            range.deleteContents();
            range.insertNode(span);
            selection.removeAllRanges();
        }
    };
    
    const clearHighlights = () => {
        const highlights = document.querySelectorAll('[class^="highlight-"]');
        highlights.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent || ''), el);
                parent.normalize();
            }
        });
    };
    
    const saveNote = () => {
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
        setNotes(prev => {
            const newNotes = { ...prev };
            delete newNotes[currentQuestionIndex];
            return newNotes;
        });
        setTempNote("");
        setShowNotes(false);
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

    const handleFinishTest = () => {
        localStorage.removeItem('aero_test_notes');
        handleCompleteTest(userAnswers, currentTest._id);
    };

    const currentQ = currentTest.questions[currentQuestionIndex];
    const isVocabQuestion = currentQ.category?.toLowerCase().includes('vocab');
    const currentAnswer = userAnswers.find(a => a.questionId === currentQ._id)?.selectedIndex;
    const currentNote = notes[currentQuestionIndex];
    
    return (
        <motion.div key="testing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-white">
            {/* Header */}
            <div className="h-12 border-b border-slate-200 bg-white flex items-center px-2 sm:px-4 gap-1 shrink-0">
                <span className="font-mono text-xs sm:text-sm text-slate-700">
                    {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,"0")}
                </span>
                
                <div className="flex items-center gap-0.5">
                    <button onClick={() => setIsHighlighterActive(!isHighlighterActive)}
                        className={`h-8 px-2 sm:px-3 rounded-md flex items-center gap-1 text-[10px] sm:text-xs font-semibold uppercase transition ${
                            isHighlighterActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                        }`}>
                        <Highlighter className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{isHighlighterActive ? "Active" : "Highlight"}</span>
                    </button>
                    
                    {isHighlighterActive && (
                        <div className="flex items-center gap-0.5 ml-1">
                            <button onClick={() => setHighlightColor('yellow')}
                                className={`w-5 h-5 rounded-full transition-all ${highlightColor === 'yellow' ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                style={{ backgroundColor: '#fef08a' }} />
                            <button onClick={() => setHighlightColor('pink')}
                                className={`w-5 h-5 rounded-full transition-all ${highlightColor === 'pink' ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                style={{ backgroundColor: '#fbcfe8' }} />
                            <button onClick={() => setHighlightColor('green')}
                                className={`w-5 h-5 rounded-full transition-all ${highlightColor === 'green' ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                style={{ backgroundColor: '#bbf7d0' }} />
                        </div>
                    )}
                    
                    <button onClick={clearHighlights}
                        className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100">
                        <X className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[10px] font-semibold">Clear</span>
                    </button>
                </div>
                
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => setShowNotes(!showNotes)}
                        className={`h-8 px-2 sm:px-3 rounded-md flex items-center gap-1 text-[10px] sm:text-xs font-semibold transition ${
                            currentNote ? "bg-blue-100 text-blue-900" : "text-slate-500 hover:bg-slate-100"
                        }`}>
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Notes</span>
                    </button>
                    
                    <button onClick={toggleFullscreen}
                        className="h-8 w-8 sm:w-auto sm:px-3 rounded-md flex items-center justify-center sm:gap-1 text-slate-500 hover:bg-slate-100">
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span className="hidden sm:inline text-[10px] font-semibold">{isFullscreen ? "Exit" : "Full"}</span>
                    </button>
                    
                    <button onClick={handleFinishTest}
                        className="h-8 px-2 sm:px-4 rounded-md bg-blue-900 hover:bg-blue-950 text-white flex items-center gap-1 text-[10px] sm:text-xs font-bold">
                        <Flag className="w-3.5 h-3.5 sm:hidden" />
                        <span>{window.innerWidth < 640 ? "End" : "Finish"}</span>
                    </button>
                </div>
            </div>
            
            {/* Notes Modal */}
            {showNotes && (
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
                        />
                        <div className="flex gap-2 mt-3">
                            <button onClick={saveNote} className="flex-1 bg-blue-900 text-white py-2 rounded-lg text-sm font-medium">
                                Save Note
                            </button>
                            {currentNote && (
                                <button onClick={deleteNote} className="px-4 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-medium">
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8" onMouseUp={applyHighlight}>
                <div className="max-w-3xl mx-auto space-y-6">
                    <div ref={passageRef} className="space-y-4">
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
                                        disabled={isEliminated}
                                        className={`w-full flex items-start gap-3 p-3 text-left border rounded-lg transition-all duration-150 ${
                                            isSelected ? 'border-blue-900 bg-blue-50/30' : 
                                            isEliminated ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' : 
                                            'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                        }`}>
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
                                                <button onClick={() => fetchVocabMeaning(opt)} disabled={loadingVocab === opt}
                                                    className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
                                                    {loadingVocab === opt ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                                                </button>
                                                <button onClick={() => saveWordTemporarily(opt)}
                                                    className="p-1.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200">
                                                    <PlusCircle className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => toggleEliminate(currentQuestionIndex, idx)}
                                            className={`p-1.5 rounded transition-all ${
                                                isEliminated ? 'bg-slate-100 text-slate-500' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                                            }`}>
                                            {isEliminated ? <RotateCcw className="w-3 h-3" /> : <Strikethrough className="w-3 h-3" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {currentNote && (
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
                    disabled={currentQuestionIndex === 0} 
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
                    <button onClick={handleFinishTest} 
                        className="bg-blue-900 text-white px-4 py-1.5 rounded-lg hover:opacity-90 text-sm">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish"}
                    </button>
                ) : (
                    <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} 
                        className="bg-slate-800 text-white px-4 py-1.5 rounded-lg hover:bg-slate-900 flex items-center gap-1 text-sm">
                        <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </footer>
        </motion.div>
    );
};

export default TestingPage;