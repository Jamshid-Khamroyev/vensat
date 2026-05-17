import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Play, Volume2, BookOpen, Layers, ArrowLeft, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { WordRecord } from "../types";

interface WordGroupProps {
  setView: (view: "landing" | "dashboard" | "create" | "testing" | "results" | "ai-gen" | "profile" | "words" | "stories" | "story-gen" | "story-reader" | "word-group") => void;
  group: { 
    name: string; 
    words: WordRecord[];
  } | null;
  handleDeleteWord: (id: string) => void;
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

const WordGroupView = ({ setView, group, handleDeleteWord }: WordGroupProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const constraintsRef = useRef(null);

  const words = group?.words && Array.isArray(group.words) ? group.words : [];
  const groupName = group?.name || "Word Group";
  
  if (!group || words.length === 0) {
    return (
      <motion.div key="word-group-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="focus-mode flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
          <p className="text-slate-500 text-lg font-medium">No words found in this group</p>
          <button onClick={() => setView("words")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">
            Back to Lexicon
          </button>
        </div>
      </motion.div>
    );
  }
    
  const activeWord = words[activeIndex];

  const goNext = useCallback(() => {
    if (activeIndex < words.length - 1) {
      setDirection(1);
      setActiveIndex(prev => prev + 1);
      setShowSentence(false);
    }
  }, [activeIndex, words.length]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex(prev => prev - 1);
      setShowSentence(false);
    }
  }, [activeIndex]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const swipeThreshold = 50;
    
    if (info.offset.x > swipeThreshold && activeIndex > 0) {
      goPrev();
    } else if (info.offset.x < -swipeThreshold && activeIndex < words.length - 1) {
      goNext();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  const progress = ((activeIndex + 1) / words.length) * 100;

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      key="word-group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col lg:flex-row min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-slate-100"
    >
      {/* Main Player Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Simple Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setView("words")}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-800 truncate">{groupName}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{words.length} ta so'z</span>
              <span>•</span>
              <span>{activeIndex + 1} / {words.length}</span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="hidden sm:flex items-center gap-1">
            {words.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex 
                    ? "w-6 bg-blue-500" 
                    : idx < activeIndex 
                    ? "w-1.5 bg-blue-200" 
                    : "w-1.5 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-0.5 bg-slate-100 w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Content Area with Swipe */}
        <div className="flex-1 flex items-center justify-center p-4 relative" ref={constraintsRef}>
          {/* Left navigation button (Desktop) */}
          {activeIndex > 0 && (
            <button
              onClick={goPrev}
              className="hidden lg:flex absolute left-4 z-10 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-all"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
          )}

          {/* Card with Swipe */}
          <div className="w-full max-md:py-12 max-w-2xl relative">
            <AnimatePresence mode="wait" custom={direction}>
              {activeWord && (
                <motion.div
                  key={activeWord._id}
                  custom={direction}
                  initial={{ x: direction > 0 ? 300 : -300, opacity: 0, rotateY: direction > 0 ? 15 : -15 }}
                  animate={{ x: 0, opacity: 1, rotateY: 0 }}
                  exit={{ x: direction > 0 ? -300 : 300, opacity: 0, rotateY: direction > 0 ? -15 : 15 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  drag="x"
                  dragConstraints={constraintsRef}
                  dragElastic={0.7}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                    {/* Card Header */}
                    <div className={`bg-gradient-to-r ${getGradient(activeIndex)} p-8 text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                      
                      <div className="relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => speakText(activeWord.term)}
                              className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all"
                            >
                              <Volume2 className="w-6 h-6" />
                            </button>
                            <div>
                              <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                                So'z {activeIndex + 1}
                              </p>
                              <p className="text-white/60 text-[11px] mt-0.5">
                                {activeWord.category || "Vocabulary"}
                              </p>
                            </div>
                          </div>
                          <div className="text-6xl font-black text-white/20">
                            {String(activeIndex + 1).padStart(2, "0")}
                          </div>
                        </div>
                        
                        <h1 className="text-4xl sm:text-6xl font-black capitalize leading-tight mt-2">
                          {activeWord.term}
                        </h1>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-8">
                      {/* Definition */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1 h-6 bg-blue-950 rounded-full" />
                          <span className="text-xs text-slate-400 uppercase tracking-wider">
                            Ma'nosi
                          </span>
                        </div>
                        <p className="text-slate-700 text-lg sm:text-xl leading-relaxed">
                          {activeWord.definition}
                        </p>
                      </div>

                      {/* Sentence */}
                      {activeWord.sentence && (
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-indigo-500" />
                              <span className="text-xs text-slate-400 uppercase tracking-wider">
                                Example Sentence
                              </span>
                            </div>
                            <button
                              onClick={() => speakText(activeWord.sentence!)}
                              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </div>
                          <p className="text-slate-600 text-base leading-relaxed italic">
                            "{activeWord.sentence}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right navigation button (Desktop) */}
          {activeIndex < words.length - 1 && (
            <button
              onClick={goNext}
              className="hidden lg:flex absolute right-4 z-10 w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg items-center justify-center hover:bg-white transition-all"
            >
              <ChevronRight className="w-6 h-6 text-slate-600" />
            </button>
          )}
        </div>

        {/* Mobile Navigation Buttons */}
        <div className="lg:hidden flex items-center justify-between gap-4 p-6 pt-0">
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Oldingi
          </button>
          
          <div className="text-xs text-slate-400 font-medium">
            {activeIndex + 1} / {words.length}
          </div>

          <button
            onClick={goNext}
            disabled={activeIndex === words.length - 1}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            Keyingi
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Simple Sidebar */}
      <aside className="lg:flex max-md:pt-36 lg:w-80 bg-white border-l border-slate-200 flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Playlist</h3>
              <p className="text-xs text-slate-500">{words.length} ta so'z</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto md:max-h-[80vh]">
          {words.map((word, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={word._id}
                onClick={() => {
                  setDirection(idx > activeIndex ? 1 : -1);
                  setActiveIndex(idx);
                  setShowSentence(false);
                }}
                className={`w-full flex items-center gap-3 p-3 text-left transition-all hover:bg-slate-50 border-l-4 ${
                  isActive ? "border-l-blue-500 bg-blue-50/30" : "border-l-transparent"
                }`}
              >
                <div className="shrink-0">
                  {isActive ? (
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isActive ? "text-blue-700" : "text-slate-700"}`}>
                    {word.term}
                  </p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{word.definition}</p>
                  {word.sentence && (
                    <p className="text-xs text-slate-300 truncate mt-0.5 italic">
                      {word.sentence.substring(0, 40)}...
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </motion.div>
  );
};

export default WordGroupView;