import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Play, Volume2, BookOpen, Layers, ArrowLeft, ArrowRight, BrainCircuit, RotateCcw, CheckCircle2, XCircle, Zap, Shuffle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { WordRecord } from "../types";

interface WordGroupProps {
  setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
  group: { name: string; words: WordRecord[] } | null;
  handleDeleteWord: (id: string) => void;
  wordsBusy?: boolean;
}

const gradients = [
  "from-rose-500 to-orange-400",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-yellow-400",
  "from-cyan-500 to-blue-500",
  "from-pink-500 to-rose-400",
  "from-indigo-500 to-blue-400",
  "from-lime-500 to-green-400",
];

const getGradient = (index: number) => gradients[index % gradients.length];

const WordGroupView = ({ setView, group, handleDeleteWord, wordsBusy = false }: WordGroupProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const words = group?.words || [];
  const activeWord = words[activeIndex];

  const goNext = useCallback(() => {
    if (activeIndex < words.length - 1) {
      setDirection(1);
      setActiveIndex(prev => prev + 1);
    }
  }, [activeIndex, words.length]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex(prev => prev - 1);
    }
  }, [activeIndex]);


  const handleDelete = (id: string) => {
    if (wordsBusy) return;
    if (!confirm("Delete this word?")) return;
    handleDeleteWord(id);
    if (activeIndex >= words.length - 1 && words.length > 1) {
      setActiveIndex(words.length - 2);
    }
  };

  // --- Flashcard State ---
  const [mode, setMode] = useState<'playlist' | 'flashcard' | 'flashcard-results'>('playlist');
  const [flashIndex, setFlashIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [shuffledWords, setShuffledWords] = useState<WordRecord[]>([]);
  const [savedHistory, setSavedHistory] = useState<{
    total: number; known: number; unknown: number; completedAt: string; wordResults: Record<string, boolean>;
  } | null>(() => {
    try {
      const raw = localStorage.getItem(`aero_flashcard_${group?.name || ''}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const currentFlashList = shuffledWords.length > 0 ? shuffledWords : words;
  const currentFlashWord = currentFlashList[flashIndex];
  const flashProgress = currentFlashList.length > 0 ? ((flashIndex) / currentFlashList.length) * 100 : 0;
  const knownCount = Object.values(results).filter(Boolean).length;
  const unknownCount = Object.values(results).filter(v => v === false).length;

  const startFlashcards = (shuffle = false) => {
    let list = [...words];
    if (shuffle) list = list.sort(() => Math.random() - 0.5);
    setShuffledWords(list);
    setFlashIndex(0);
    setShowAnswer(false);
    setResults({});
    setMode('flashcard');
  };

  const handleFlashResult = useCallback((known: boolean) => {
    if (!currentFlashWord) return;
    const nextResults = { ...results, [currentFlashWord._id]: known };
    setResults(nextResults);
    setShowAnswer(false);
    if (flashIndex < currentFlashList.length - 1) {
      setFlashIndex(prev => prev + 1);
    } else {
      // Finish
      const finalKnown = Object.values(nextResults).filter(Boolean).length;
      const finalUnknown = Object.values(nextResults).filter(v => v === false).length;
      const record = {
        groupName: group?.name || '',
        total: currentFlashList.length,
        known: finalKnown,
        unknown: finalUnknown,
        completedAt: new Date().toISOString(),
        wordResults: nextResults,
      };
      localStorage.setItem(`aero_flashcard_${group?.name || ''}`, JSON.stringify(record));
      setSavedHistory(record);
      setMode('flashcard-results');
    }
  }, [currentFlashWord, results, flashIndex, currentFlashList, group]);

  const resetFlashcard = () => {
    setFlashIndex(0);
    setShowAnswer(false);
    setResults({});
    setMode('playlist');
    setShuffledWords([]);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'flashcard' && currentFlashWord) {
        if (e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          setShowAnswer(prev => !prev);
        }
        if (showAnswer) {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            handleFlashResult(false);
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            handleFlashResult(true);
          }
        }
        return;
      }
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, mode, showAnswer, currentFlashWord, handleFlashResult]);

  if (!group || words.length === 0) {
    return (
      <motion.div key="word-group-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="focus-mode flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-lg font-medium">No words found in this group</p>
          <button onClick={() => setView("words")} className="bluebook-button">
            Back to Lexicon
          </button>
        </div>
      </motion.div>
    );
  }

  const progress = ((activeIndex + 1) / words.length) * 100;

  return (
    <motion.div
      key="word-group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-slate-50"
    >
      {/* Main Player Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => { resetFlashcard(); setView("words"); }}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">{group.name}</h2>
            <p className="text-xs text-slate-400 font-medium">
              {mode === 'playlist'
                ? `${words.length} words • Playing ${activeIndex + 1} of ${words.length}`
                : mode === 'flashcard'
                ? `Flashcard ${flashIndex + 1} of ${currentFlashList.length}`
                : 'Flashcard Results'}
            </p>
          </div>

          {/* Mode Tabs */}
          {mode !== 'flashcard-results' && (
            <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setMode('playlist')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  mode === 'playlist' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Playlist
              </button>
              <button
                onClick={() => mode !== 'flashcard' && startFlashcards(false)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  mode === 'flashcard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Flashcards
              </button>
            </div>
          )}

          {/* Mobile mode dropdown simplified as buttons */}
          <div className="flex sm:hidden items-center gap-1">
            {mode === 'flashcard' && (
              <button onClick={resetFlashcard} className="p-2 text-slate-400 hover:text-slate-600">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
          <motion.div
            className={`h-full ${mode === 'flashcard' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${mode === 'flashcard' ? flashProgress : progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 overflow-y-auto">

          {/* --- PLAYLIST MODE --- */}
          {mode === 'playlist' && (
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait" custom={direction}>
                {activeWord && (
                  <motion.div
                    key={activeWord._id}
                    custom={direction}
                    initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className={`bg-gradient-to-r ${getGradient(activeIndex)} p-6 sm:p-8 text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Volume2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Word {activeIndex + 1}</p>
                            <p className="text-white/60 text-[10px]">{activeWord.category || "Vocabulary"}</p>
                          </div>
                        </div>
                        <span className="text-5xl sm:text-7xl font-black text-white/20">{String(activeIndex + 1).padStart(2, "0")}</span>
                      </div>
                      <h1 className="relative text-3xl sm:text-5xl font-black mt-4 sm:mt-6 capitalize leading-tight">
                        {activeWord.term}
                      </h1>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">Definition</span>
                        <p className="text-slate-700 text-lg sm:text-xl leading-relaxed font-medium">
                          {activeWord.definition}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <button
                          onClick={() => handleDelete(activeWord._id)}
                          disabled={wordsBusy}
                          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                        >
                          {wordsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Remove
                        </button>
                        <span className="text-xs text-slate-400 font-mono">
                          Added {activeWord.createdAt ? new Date(activeWord.createdAt).toLocaleDateString() : "recently"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Controls */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-1.5">
                  {words.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setDirection(idx > activeIndex ? 1 : -1);
                        setActiveIndex(idx);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === activeIndex ? "bg-blue-500 w-6" : "bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={goNext}
                  disabled={activeIndex === words.length - 1}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Start Flashcards CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => startFlashcards(false)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  <Zap className="w-4 h-4" />
                  Start Flashcards
                </button>
                <button
                  onClick={() => startFlashcards(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle & Study
                </button>
              </div>

              {savedHistory && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-slate-400">
                    Last study: {savedHistory.known} known, {savedHistory.unknown} unknown
                    {' '}•{' '}
                    {new Date(savedHistory.completedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* --- FLASHCARD MODE --- */}
          {mode === 'flashcard' && currentFlashWord && (
            <div className="w-full max-w-xl flex flex-col items-center gap-6">
              {/* Card */}
              <div className="w-full perspective-1000">
                <motion.div
                  key={currentFlashWord._id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="relative cursor-pointer select-none"
                >
                  <div className={`bg-white rounded-3xl shadow-2xl border-2 ${showAnswer ? 'border-emerald-200' : 'border-slate-200'} overflow-hidden transition-colors duration-300`}>
                    {/* Front / Back shared header */}
                    <div className={`p-8 sm:p-12 text-center ${showAnswer ? 'bg-emerald-50' : 'bg-slate-50'} transition-colors duration-300`}>
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <BrainCircuit className={`w-5 h-5 ${showAnswer ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                          {showAnswer ? 'Answer' : 'Question'} {flashIndex + 1} / {currentFlashList.length}
                        </span>
                      </div>

                      {!showAnswer ? (
                        <h1 className="text-4xl sm:text-6xl font-black text-slate-800 capitalize leading-tight">
                          {currentFlashWord.term}
                        </h1>
                      ) : (
                        <div className="space-y-4">
                          <h2 className="text-2xl sm:text-3xl font-bold text-emerald-700 capitalize">
                            {currentFlashWord.term}
                          </h2>
                          <div className="w-12 h-1 bg-emerald-200 rounded-full mx-auto" />
                          <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-medium">
                            {currentFlashWord.definition}
                          </p>
                        </div>
                      )}

                      <p className="mt-6 text-xs text-slate-400 font-medium">
                        {showAnswer ? 'Tap to see word again' : 'Tap to reveal meaning'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center gap-4 w-full max-w-xl"
                  >
                    <button
                      onClick={() => handleFlashResult(false)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-rose-500 text-white font-bold text-base hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-200"
                    >
                      <XCircle className="w-5 h-5" />
                      Bilmadim
                    </button>
                    <button
                      onClick={() => handleFlashResult(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 text-white font-bold text-base hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-200"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Bildim
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showAnswer && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Press</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">Space</kbd>
                  <span>to flip</span>
                </div>
              )}
            </div>
          )}

          {/* --- FLASHCARD RESULTS --- */}
          {mode === 'flashcard-results' && (
            <div className="w-full max-w-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Zap className="w-10 h-10 mx-auto mb-3" />
                  <h2 className="text-2xl font-black">Study Session Complete!</h2>
                  <p className="text-white/80 text-sm mt-1">{group.name}</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-slate-800">{currentFlashList.length}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total</div>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-emerald-600">{knownCount}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mt-1">Bildim</div>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-4 text-center">
                      <div className="text-2xl font-black text-rose-600">{unknownCount}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mt-1">Bilmadim</div>
                    </div>
                  </div>

                  {/* Word list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {currentFlashList.map((word) => {
                      const known = results[word._id];
                      return (
                        <div key={word._id} className={`flex items-center gap-3 p-3 rounded-xl ${known ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${known ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {known ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 truncate">{word.term}</p>
                            <p className="text-xs text-slate-500 truncate">{word.definition}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={resetFlashcard}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Playlist
                    </button>
                    <button
                      onClick={() => startFlashcards(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Study Again
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Playlist */}
      {mode === 'playlist' && (
        <aside className="w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col max-h-[calc(100vh-64px)]">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Playlist</h3>
                <p className="text-xs text-slate-500">{words.length} words • Autoplay</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {words.map((word, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={word._id}
                  onClick={() => {
                    setDirection(idx > activeIndex ? 1 : -1);
                    setActiveIndex(idx);
                  }}
                  className={`w-full flex items-start gap-3 p-3 text-left transition-all border-b border-slate-50 hover:bg-slate-50 ${
                    isActive ? "bg-blue-50/60 border-l-4 border-l-blue-500" : "border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isActive ? (
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                        {idx + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
                      {word.term}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{word.definition}</p>
                    {isActive && (
                      <div className="mt-1.5">
                        <div className="h-0.5 bg-blue-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-blue-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "linear" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sidebar Flashcard CTA */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-2">
            <button
              onClick={() => startFlashcards(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
            >
              <Zap className="w-4 h-4" />
              Start Flashcards
            </button>
            <button
              onClick={() => startFlashcards(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle & Study
            </button>
          </div>
        </aside>
      )}
    </motion.div>
  );
};

export default WordGroupView;
